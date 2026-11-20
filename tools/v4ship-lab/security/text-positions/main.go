// A separate whole-fragment helper. Output byte locations, never matched values.
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"sort"

	"github.com/rs/zerolog"
	"github.com/zricethezav/gitleaks/v8/config"
	"github.com/zricethezav/gitleaks/v8/detect"
)

type position struct {
	StartLine   int
	EndLine     int
	StartColumn int
	EndColumn   int
	RuleID      string
	MatchStart  int
	MatchEnd    int
	ScalarStart int
	ScalarEnd   int
	ExactBytes  bool
}

func run() error {
	zerolog.SetGlobalLevel(zerolog.Disabled)
	if len(os.Args) != 2 {
		return errors.New("config required")
	}
	pinned, err := os.ReadFile(os.Args[1])
	if err != nil || !bytes.Equal(pinned, []byte(config.DefaultConfig)) {
		return errors.New("config mismatch")
	}
	data, err := io.ReadAll(io.LimitReader(os.Stdin, 20000001))
	if err != nil || len(data) > 20000000 {
		return errors.New("invalid input")
	}
	detector, err := detect.NewDetectorDefaultConfig()
	if err != nil {
		return errors.New("invalid detector")
	}
	detector.IgnoreGitleaksAllow = true
	detector.Redact = 0
	detector.Verbose = false
	detector.NoColor = true
	detector.MaxTargetMegaBytes = 0
	detector.MaxDecodeDepth = 0
	detector.MaxArchiveDepth = 0
	newlines := []int{}
	for i, b := range data {
		if b == '\n' {
			newlines = append(newlines, i)
		}
	}
	base := func(line int) (int, bool) {
		if line == 1 {
			return 0, true
		}
		if line < 2 || line-2 >= len(newlines) {
			return 0, false
		}
		return newlines[line-2], true
	}
	rows := []position{}
	for _, f := range detector.Detect(detect.Fragment{Raw: string(data), FilePath: "position-input.txt", StartLine: 1}) {
		a, aok := base(f.StartLine)
		b, bok := base(f.EndLine)
		start, end := a+f.StartColumn-1, b+f.EndColumn
		p := position{StartLine: f.StartLine, EndLine: f.EndLine, StartColumn: f.StartColumn, EndColumn: f.EndColumn, RuleID: f.RuleID,
			MatchStart: start, MatchEnd: end, ScalarStart: -1, ScalarEnd: -1}
		match, secret := []byte(f.Match), []byte(f.Secret)
		if aok && bok && start >= 0 && end >= start && end <= len(data) && len(secret) > 0 && bytes.Equal(data[start:end], match) && bytes.Count(match, secret) == 1 {
			p.ScalarStart = start + bytes.Index(match, secret)
			p.ScalarEnd = p.ScalarStart + len(secret)
			p.ExactBytes = bytes.Equal(data[p.ScalarStart:p.ScalarEnd], secret)
		}
		rows = append(rows, p)
	}
	sort.Slice(rows, func(i, j int) bool {
		if rows[i].MatchStart != rows[j].MatchStart {
			return rows[i].MatchStart < rows[j].MatchStart
		}
		return rows[i].RuleID < rows[j].RuleID
	})
	return json.NewEncoder(os.Stdout).Encode(rows)
}

func main() {
	defer func() {
		if recover() != nil {
			fmt.Fprintln(os.Stderr, "position detector failed; details suppressed")
			os.Exit(1)
		}
	}()
	if run() != nil {
		fmt.Fprintln(os.Stderr, "position detector failed; details suppressed")
		os.Exit(1)
	}
}
