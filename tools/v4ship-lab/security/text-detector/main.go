// Send complete, exact text fragments to the pinned detector; emit locations only.
package main

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"sort"
	"time"
	"unicode/utf8"

	"github.com/rs/zerolog"
	"github.com/zricethezav/gitleaks/v8/config"
	"github.com/zricethezav/gitleaks/v8/detect"
)

type request struct {
	ID     string `json:"id"`
	Path   string `json:"path"`
	Bytes  int    `json:"bytes"`
	SHA256 string `json:"sha256"`
}

type finding struct {
	File           string `json:"file"`
	Line           int    `json:"line"`
	EndLine        int    `json:"endLine"`
	Type           string `json:"type"`
	Classification string `json:"classification"`
}

func digest(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func run() error {
	zerolog.SetGlobalLevel(zerolog.Disabled)
	if len(os.Args) != 2 {
		return errors.New("config argument required")
	}
	pinned, err := os.ReadFile(os.Args[1])
	if err != nil || !bytes.Equal(pinned, []byte(config.DefaultConfig)) {
		return errors.New("embedded config differs from pinned config")
	}
	detector, err := detect.NewDetectorDefaultConfig()
	if err != nil {
		return errors.New("config rejected")
	}
	detector.IgnoreGitleaksAllow = true
	detector.Redact = 100
	detector.NoColor = true
	detector.Verbose = false
	detector.MaxTargetMegaBytes = 0
	detector.MaxDecodeDepth = 0
	detector.MaxArchiveDepth = 0
	reader, writer := bufio.NewReader(os.Stdin), json.NewEncoder(os.Stdout)
	if err := writer.Encode(map[string]any{"ready": true, "configSha256": digest(pinned), "rules": len(detector.Config.Rules), "module": "github.com/zricethezav/gitleaks/v8@v8.30.1", "wholeFragments": true, "rawValuesEmitted": false}); err != nil {
		return err
	}
	for {
		line, err := reader.ReadBytes('\n')
		if err == io.EOF && len(line) == 0 {
			return nil
		}
		if err != nil || len(line) > 65536 {
			return errors.New("invalid frame header")
		}
		var input request
		if json.Unmarshal(line, &input) != nil || input.Bytes < 0 || input.Bytes > 1000000000 || input.ID == "" || input.Path == "" {
			return errors.New("invalid request")
		}
		data := make([]byte, input.Bytes)
		if _, err := io.ReadFull(reader, data); err != nil {
			return errors.New("incomplete payload")
		}
		if digest(data) != input.SHA256 || !utf8.Valid(data) || bytes.IndexByte(data, 0) >= 0 {
			return errors.New("payload identity or text classification failed")
		}
		started := time.Now()
		raw := detector.Detect(detect.Fragment{Raw: string(data), FilePath: input.Path, StartLine: 1})
		safe := make([]finding, 0, len(raw))
		for _, row := range raw {
			safe = append(safe, finding{row.File, row.StartLine, row.EndLine, row.RuleID, "unresolved"})
		}
		sort.Slice(safe, func(i, j int) bool {
			if safe[i].File != safe[j].File {
				return safe[i].File < safe[j].File
			}
			if safe[i].Line != safe[j].Line {
				return safe[i].Line < safe[j].Line
			}
			return safe[i].Type < safe[j].Type
		})
		if err := writer.Encode(map[string]any{"id": input.ID, "path": input.Path, "bytes": len(data), "sha256": input.SHA256, "seconds": time.Since(started).Seconds(), "findings": safe, "complete": true}); err != nil {
			return err
		}
	}
}

func main() {
	// Error details, panic values and detector matches never reach stdout/stderr.
	defer func() {
		if recover() != nil {
			fmt.Fprintln(os.Stderr, "text detector failed; details suppressed")
			os.Exit(1)
		}
	}()
	if run() != nil {
		fmt.Fprintln(os.Stderr, "text detector failed; details suppressed")
		os.Exit(1)
	}
}
