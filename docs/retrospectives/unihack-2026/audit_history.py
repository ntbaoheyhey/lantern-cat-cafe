"""Re-read a pinned Lantern Git inventory. No checkout, network or deployment."""
import argparse
import collections
import gzip
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import tempfile


def git(*args, data=None):
    return subprocess.check_output(["git", *args], input=data)


def references(snapshot):
    groups = ["remoteBranches", "remoteTags", "localBranches"]
    roots = set().union(*(snapshot[key].values() for key in groups))
    roots.update(pr["headRefOid"] for pr in snapshot["pullRequests"])
    return ("\n".join(sorted(roots)) + "\n").encode()


SOURCE = set("ts tsx mts cts js jsx mjs cjs py rb sh bash zsh fish ps1 bat cmd go rs java kt cs c h cc cpp hpp swift php sol sql css scss less sass html htm svelte vue glsl vert frag wgsl gd gdshader pl lua ipynb asm m mm tsproto proto yul fsx r dart circom move vy awk ahk make cmake sx".split())
CONFIG = set("json jsonc yaml yml toml ini cfg conf xml lock env properties plist nix gradle rules graphql gitattributes gitignore gitmodules nvmrc".split())
TEXTDATA = set("md mdx txt csv tsv log jsonl ndjson srt vtt patch diff svg rst license".split())


def path_kind(path):
    p = PurePosixPath(path)
    name = p.name.lower()
    ext = p.suffix.lower().lstrip(".") or name.lstrip(".")
    if ext in SOURCE or name in {"makefile", "dockerfile", "justfile", "gemfile"} or name.startswith("dockerfile."):
        return "source"
    if ext in CONFIG or name.startswith(".env") or name.endswith("rc"):
        return "config"
    if ext in TEXTDATA or name.startswith(("license", "readme")):
        return "text-data"
    return "other"


def snapshot_tree(ref):
    rows = git("ls-tree", "-r", "-z", ref).split(b"\0")
    paths = {}
    for row in rows:
        if row:
            header, key = row.split(b"\t", 1)
            paths[key] = header.split()[2]
    return paths


def scan_tips(refs, out):
    base = refs["remoteBranches"]["main"]
    base_paths = snapshot_tree(base)
    graph = git("rev-list", "--parents", "--topo-order", "--reverse", "--stdin", data=references(refs))
    masks = {}
    for i, line in enumerate(graph.decode().splitlines()):
        commit, *parents = line.split()
        mask = 1 << i
        for parent in parents:
            mask |= masks[parent]
        masks[commit] = mask
    namespace = dict(refs["remoteBranches"])
    namespace.update({"local/" + k: v for k, v in refs["localBranches"].items() if refs["remoteBranches"].get(k) != v})
    revs = set(namespace.values()) | set(refs["remoteTags"].values())
    revs.update(pr["headRefOid"] for pr in refs["pullRequests"])
    tree_lookup = git("cat-file", "--batch-check=%(objectname)", data=b"".join((r + "^{tree}\n").encode() for r in sorted(revs))).decode().splitlines()
    cache, by_commit = {}, {}
    for r, tree in zip(sorted(revs), tree_lookup):
        if tree not in cache:
            tree_paths = snapshot_tree(tree)
            counts = collections.Counter(path_kind(os.fsdecode(p)) for p in tree_paths)
            common = tree_paths.keys() & base_paths.keys()
            same = sum(tree_paths[k] == base_paths[k] for k in common)
            cache[tree] = {"tree": tree, "paths": len(tree_paths), "sourcePaths": counts["source"],
                           "branchOnlyPaths": len(tree_paths) - len(common), "mainOnlyPaths": len(base_paths) - len(common),
                           "differentObjectAtCommonPath": len(common) - same}
        ahead = bin(masks[r] & ~masks[base]).count("1")
        behind = bin(masks[base] & ~masks[r]).count("1")
        by_commit[r] = {**cache[tree], "aheadOfMainByAncestry": ahead, "behindMainByAncestry": behind}
    (out / "tip-results.json").write_text(json.dumps(by_commit, separators=(",", ":")))
    print(f"Tips {len(revs)}, distinct trees {len(cache)}, commits in history {len(masks)}", flush=True)


def scan_history(refs, out):
    objects = {}
    for line in git("rev-list", "--objects", "--stdin", data=references(refs)).splitlines():
        oid, _, name = line.partition(b" ")
        objects[oid] = name.decode("utf-8", "replace")
    ids = list(objects)
    metadata = git("cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)", data=b"\n".join(ids) + b"\n")
    kinds = collections.Counter()
    blobs = []
    for row in metadata.splitlines():
        oid, typ, length = row.split()
        kinds[typ.decode()] += 1
        if typ == b"blob":
            blobs.append((oid, int(length)))
    stats = collections.defaultdict(lambda: {"blobs": 0, "bytes": 0, "lines": 0})
    lfs = 0
    with tempfile.TemporaryFile() as ifile, gzip.open(out / "blob-inventory.jsonl.gz", "wt", encoding="utf-8", compresslevel=5) as manifest:
        ifile.write(b"".join(oid + b"\n" for oid, _ in blobs))
        ifile.seek(0)
        proc = subprocess.Popen(["git", "cat-file", "--batch"], stdin=ifile, stdout=subprocess.PIPE)
        with proc.stdout as content:
            for i, (oid, size) in enumerate(blobs):
                if content.readline().split() != [oid, b"blob", str(size).encode()]:
                    raise RuntimeError("Git batch header mismatch at " + oid.decode())
                digest = hashlib.sha1(b"blob " + str(size).encode() + b"\0")
                head = content.read(min(size, 8192))
                is_text = b"\0" not in head and not head.startswith((b"\x89PNG", b"\xff\xd8\xff", b"GIF8", b"RIFF", b"PK\x03\x04", b"\x1f\x8b"))
                path = objects[oid]
                k = path_kind(path) if is_text else "binary"
                if k == "other" and is_text:
                    k = "source" if head.startswith(b"#!") else "other-text"
                if head.startswith(b"version https://git-lfs.github.com/spec/v1"):
                    lfs += 1
                count, tail, left = 0, b"", size
                block = head
                while left:
                    if not block:
                        raise RuntimeError("Incomplete blob " + oid.decode())
                    digest.update(block)
                    if is_text:
                        count += block.count(b"\n")
                        tail = block[-1:]
                    left -= len(block)
                    if left:
                        block = content.read(min(left, 1024 * 1024))
                if digest.hexdigest() != oid.decode() or content.read(1) != b"\n":
                    raise RuntimeError("Content checksum mismatch " + oid.decode())
                count += int(bool(is_text and size and tail != b"\n"))
                stats[k]["blobs"] += 1
                stats[k]["bytes"] += size
                stats[k]["lines"] += count
                manifest.write(json.dumps([oid.decode(), path, k, size, count], ensure_ascii=True, separators=(",", ":")) + "\n")
                if (i + 1) % 25000 == 0:
                    print(f"Verified {i+1}/{len(blobs)} unique blobs", flush=True)
        if proc.wait():
            raise RuntimeError("git cat-file failed")
    summary = {"objectsByType": dict(kinds), "categoriesByRepresentativePath": dict(stats), "lfsPointers": lfs,
               "blobCount": len(blobs), "blobBytes": sum(s for _, s in blobs), "allBlobChecksumsMatched": True}
    (out / "history-summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, separators=(",", ":")), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["history", "tips"])
    parser.add_argument("snapshot", type=Path, help="Pinned JSON, or its gzip file")
    parser.add_argument("out", type=Path, help="An output directory for the selected mode")
    args = parser.parse_args()
    args.out.mkdir(exist_ok=True, parents=True)
    opener = gzip.open if args.snapshot.suffix == ".gz" else open
    with opener(args.snapshot, "rt", encoding="utf-8") as infile:
        snapshot = json.load(infile)
    (scan_history if args.mode == "history" else scan_tips)(snapshot, args.out)
