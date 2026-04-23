import { spawn } from "bun"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"

export type ArchiveEntry = {
	path: string
	type: "file" | "directory" | "symlink" | "hardlink"
	linkPath?: string
}

function normalizeArchivePath(filePath: string): string {
	return filePath.replaceAll("\\", "/")
}

function containsTraversalSegment(filePath: string): boolean {
	return normalizeArchivePath(filePath)
		.split("/")
		.some(segment => segment === "..")
}

function isArchiveAbsolutePath(filePath: string): boolean {
	const normalizedPath = normalizeArchivePath(filePath)
	return isAbsolute(normalizedPath) || /^[A-Za-z]:\//.test(normalizedPath) || normalizedPath.startsWith("//")
}

function escapesDirectory(rootDir: string, candidatePath: string): boolean {
	const relativePath = relative(rootDir, candidatePath)
	return relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)
}

function resolveContainedPath(rootDir: string, filePath: string, errorLabel: string): string {
	const normalizedPath = normalizeArchivePath(filePath)
	if (isArchiveAbsolutePath(normalizedPath)) {
		throw new Error(`Unsafe archive entry: ${errorLabel} uses an absolute path (${filePath})`)
	}

	if (containsTraversalSegment(normalizedPath)) {
		throw new Error(`Unsafe archive entry: ${errorLabel} contains path traversal (${filePath})`)
	}

	const resolvedPath = resolve(rootDir, normalizedPath)
	if (escapesDirectory(rootDir, resolvedPath)) {
		throw new Error(`Unsafe archive entry: ${errorLabel} contains path traversal (${filePath})`)
	}

	return resolvedPath
}

export function validateArchiveEntries(entries: ArchiveEntry[], destDir: string): void {
	const resolvedDestDir = resolve(destDir)

	for (const entry of entries) {
		const resolvedEntryPath = resolveContainedPath(resolvedDestDir, entry.path, "path")
		if (entry.type !== "symlink" && entry.type !== "hardlink") {
			continue
		}

		if (!entry.linkPath) {
			throw new Error(
				`Unsafe archive entry: ${entry.type === "symlink" ? "symlink" : "hard link"} target missing for ${entry.path}`
			)
		}

		const normalizedLinkPath = normalizeArchivePath(entry.linkPath)
		const linkTypeLabel = entry.type === "symlink" ? "symlink target" : "hard link target"
		if (isArchiveAbsolutePath(normalizedLinkPath)) {
			throw new Error(
				`Unsafe archive entry: ${linkTypeLabel} uses an absolute path (${entry.linkPath})`
			)
		}

		if (containsTraversalSegment(normalizedLinkPath)) {
			throw new Error(
				`Unsafe archive entry: ${linkTypeLabel} contains path traversal (${entry.linkPath})`
			)
		}

		const resolvedLinkPath = resolve(dirname(resolvedEntryPath), normalizedLinkPath)
		if (escapesDirectory(resolvedDestDir, resolvedLinkPath)) {
			throw new Error(
				`Unsafe archive entry: ${linkTypeLabel} escapes extraction directory (${entry.linkPath})`
			)
		}
	}
}

async function listTarEntries(archivePath: string): Promise<ArchiveEntry[]> {
	const script = [
		"import json, sys, tarfile",
		"entries = []",
		"with tarfile.open(sys.argv[1], 'r:gz') as archive:",
		"    for member in archive.getmembers():",
		"        entry_type = 'file'",
		"        if member.isdir():",
		"            entry_type = 'directory'",
		"        elif member.issym():",
		"            entry_type = 'symlink'",
		"        elif member.islnk():",
		"            entry_type = 'hardlink'",
		"        entries.append({",
		"            'path': member.name,",
		"            'type': entry_type,",
		"            'linkPath': member.linkname or None,",
		"        })",
		"print(json.dumps(entries))",
	].join("\n")
	const process = spawn(["python3", "-c", script, archivePath], {
		stdout: "pipe",
		stderr: "pipe",
	})
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
		process.exited,
	])

	if (exitCode !== 0) {
		throw new Error(stderr.trim() || stdout.trim() || `python3 exited with code ${exitCode}`)
	}

	return JSON.parse(stdout) as ArchiveEntry[]
}

export async function extractTarGz(archivePath: string, destDir: string): Promise<void> {
	validateArchiveEntries(await listTarEntries(archivePath), destDir)

	const process = spawn(["tar", "-xzf", archivePath, "-C", destDir], {
		stdout: "pipe",
		stderr: "pipe",
	})
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
		process.exited,
	])

	if (exitCode !== 0) {
		throw new Error(stderr.trim() || stdout.trim() || `tar exited with code ${exitCode}`)
	}
}
