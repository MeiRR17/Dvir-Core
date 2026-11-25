# MLX metadata probe — descriptor-anchored filesystem boundary

Date: 2026-11-25. Owner: Agent B for runtime implementation; Agent A maintains this acceptance note. Status: design / NOT_IMPLEMENTED / NOT_TESTED. This note does not authorize a host probe.

## Threat and scope

The probe is allowed to inspect only the site-packages directory selected by an owner-controlled opaque environment handle. It may enumerate entry names and verify candidate `.dist-info` directories. It must not import Python packages, read `.pth` files, inspect model caches, follow symlinks, or expose the absolute path or package version in its public result.

The current implementation checks path components with `lstat`, compares `realpath`, then calls path-based `opendir(absolute)`. An attacker able to replace a path component between those operations can redirect the scan. Static symlink tests do not prove race resistance.

## Required boundary

A path-based check followed by path-based `opendir` is not acceptable for host qualification. Use a directory descriptor as the stable root object and anchor all subsequent traversal to that descriptor.

Preferred implementation order:

1. Resolve the opaque handle using the owner-configured resolver. Reject unknown handles, non-absolute paths, filesystem roots and resolver failures.
2. Canonicalize the selected path and reject static symlink components. Capture the canonical root's device/inode and verify it is a directory.
3. Open the root with `O_RDONLY | O_DIRECTORY | O_NOFOLLOW` (or the platform-equivalent flags). Immediately `fstat` the opened descriptor and require its device/inode to equal the previously captured canonical root identity. This detects an ancestor/path swap that redirects the open to a different directory. Fail closed if the platform lacks the required no-follow/directory flags.
4. Keep the root descriptor open for the entire scan. Perform enumeration and candidate-child opens through a descriptor-anchored namespace, not the original absolute path. On Linux, a `/proc/self/fd/<fd>` anchor may be used only after runtime validation; on macOS, validate `/dev/fd/<fd>` on the supported APFS/macOS target. If that namespace is unavailable or does not resolve to the same device/inode, return all package states as `unknown`. Do not silently fall back to the original path.
5. For each matching `.dist-info` entry, open the child directory relative to the anchored root with `O_DIRECTORY | O_NOFOLLOW`, then `fstat` it. A symlink, non-directory, replacement race or open failure marks the relevant package `unknown`; never follow it. The probe needs no file contents.
6. Close every child descriptor and the root descriptor in `finally` paths, including entry-limit, parse, error and cancellation exits. No descriptor may leak across repeated probes.

A small native `openat(2)` helper is an alternative only if the Node fd-namespace approach cannot be validated on macOS. It would need a narrow API that returns directory-entry names/types only, no arbitrary paths, and its own build, ABI, denial and cleanup tests. Do not introduce it merely as an untested abstraction.

The fd-namespace approach is a candidate implementation strategy, not a security claim until macOS and Linux tests demonstrate that the descriptor remains anchored when the original path/ancestor is renamed or replaced. A same-device/inode comparison is mandatory; `realpath` or string-prefix checks alone are insufficient.

## Acceptance tests

- Approved canonical site-packages directory returns the same aggregate presence states and respects the entry limit.
- Unknown opaque handle, resolver exception, filesystem root, non-directory, symlinked root and symlinked ancestor all fail closed.
- Root path/ancestor replaced between validation and descriptor open: the opened descriptor must fail the captured device/inode check or still identify the approved directory; it must never scan a replacement target.
- Original root or ancestor renamed/replaced after the descriptor is open: traversal remains anchored to the originally opened directory or fails closed; it never follows the replacement path.
- A matching child `.dist-info` symlink to an external directory is not followed and yields `unknown`.
- A child entry changed to a symlink between enumeration and open is rejected by `O_NOFOLLOW`.
- Descriptor namespace unavailable, flags unavailable, descriptor identity mismatch or any unexpected filesystem error returns `unavailable` with every package `unknown`.
- Entry-limit behavior never returns partial absence.
- Repeated success and failure paths leave no open descriptors.
- Run the exact fixture suite on Node 22.18.0 on Linux and on the actual supported macOS/APFS host. Record exact OS, Node, test command, exit code and counts. A Linux-only pass does not qualify macOS.

## Gate

Until the implementation and both platform fixture suites pass on one exact source SHA, MLX metadata discovery remains fixture-only and Core-host probing is prohibited. Even after that gate, the probe is read-only package metadata discovery, not MLX importability, hardware compatibility, model capability or inference evidence.
