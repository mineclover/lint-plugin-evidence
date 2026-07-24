package evidence

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const resolvedIndexVersion = 1

type resolvedIndex struct {
	Version      int                        `json:"version"`
	Declarations []resolvedIndexDeclaration `json:"declarations"`
}

type resolvedIndexDeclaration struct {
	ID             string              `json:"id"`
	Tag            tagKind             `json:"tag"`
	Target         string              `json:"target"`
	Reason         string              `json:"reason"`
	Source         resolvedIndexSource `json:"source"`
	Hosts          []resolvedIndexHost `json:"hosts"`
	ResolvedTarget resolvedIndexTarget `json:"resolvedTarget"`
}

type resolvedIndexSource struct {
	File string `json:"file"`
	Line int    `json:"line"`
}

type resolvedIndexHost struct {
	PublicName  string              `json:"publicName"`
	Symbol      string              `json:"symbol"`
	Declaration resolvedIndexSource `json:"declaration"`
}

type resolvedIndexTarget struct {
	ID     string              `json:"id"`
	Target string              `json:"target"`
	Type   artifactKind        `json:"type"`
	Symbol string              `json:"symbol"`
	Source resolvedIndexSource `json:"source"`
}

func writeResolvedEvidenceIndex(
	root string,
	output string,
	states []claimState,
	resolved map[string]*evidenceUnit,
) string {
	destination, problem := resolvedIndexPath(root, output)
	if problem != "" {
		return problem
	}
	declarations := map[string]*evidenceDeclaration{}
	for _, state := range states {
		for _, declaration := range state.Declarations {
			declarations[declaration.ID] = declaration
		}
	}
	ids := make([]string, 0, len(declarations))
	for id := range declarations {
		if resolved[id] != nil {
			ids = append(ids, id)
		}
	}
	sort.Strings(ids)
	index := resolvedIndex{Version: resolvedIndexVersion, Declarations: make([]resolvedIndexDeclaration, 0, len(ids))}
	for _, id := range ids {
		declaration := declarations[id]
		unit := resolved[id]
		hosts := make([]resolvedIndexHost, 0, len(declaration.HostAnchors))
		for _, host := range declaration.HostAnchors {
			hosts = append(hosts, resolvedIndexHost{
				PublicName:  host.Target,
				Symbol:      host.Symbol,
				Declaration: resolvedIndexSource{File: host.Path, Line: host.Line},
			})
		}
		index.Declarations = append(index.Declarations, resolvedIndexDeclaration{
			ID:     declaration.ID,
			Tag:    declaration.Tag,
			Target: declaration.Target,
			Reason: declaration.Reason,
			Source: resolvedIndexSource{File: declaration.Path, Line: declaration.Line},
			Hosts:  hosts,
			ResolvedTarget: resolvedIndexTarget{
				ID:     unit.ID,
				Target: unit.Target,
				Type:   unit.Type,
				Symbol: unit.Symbol,
				Source: resolvedIndexSource{File: unit.Path, Line: unit.Line},
			},
		})
	}
	encoded, err := json.MarshalIndent(index, "", "  ")
	if err != nil {
		return "Evidence graph could not encode resolved declaration index '" + output + "': " + err.Error()
	}
	if err := os.MkdirAll(filepath.Dir(destination), 0o755); err != nil {
		return "Evidence graph could not create resolved declaration index directory for '" + output + "': " + err.Error()
	}
	temporary, err := os.CreateTemp(filepath.Dir(destination), ".evidence-index-*")
	if err != nil {
		return "Evidence graph could not create resolved declaration index '" + output + "': " + err.Error()
	}
	temporaryName := temporary.Name()
	defer os.Remove(temporaryName)
	if _, err := temporary.Write(append(encoded, '\n')); err != nil {
		temporary.Close()
		return "Evidence graph could not write resolved declaration index '" + output + "': " + err.Error()
	}
	if err := temporary.Close(); err != nil {
		return "Evidence graph could not finalize resolved declaration index '" + output + "': " + err.Error()
	}
	if err := os.Rename(temporaryName, destination); err != nil {
		return "Evidence graph could not publish resolved declaration index '" + output + "': " + err.Error()
	}
	return ""
}

func resolvedIndexPath(root string, output string) (string, string) {
	if filepath.IsAbs(output) {
		return "", "Invalid evidence-graph/index configuration at index.output: path must be project-relative."
	}
	destination := filepath.Clean(filepath.Join(root, output))
	relative, err := filepath.Rel(root, destination)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return "", "Invalid evidence-graph/index configuration at index.output: path must not escape the project root."
	}
	return destination, ""
}
