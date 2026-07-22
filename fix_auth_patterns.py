#!/usr/bin/env python3
"""
Script to fix requireAuth patterns across the codebase.
Replaces: const user = await requireAuth(...);
With:     const { user, error } = await requireAuth(...);
          if (error || !user) { ... }
"""

import os
import re
from pathlib import Path

# Pattern to find
OLD_PATTERN = re.compile(r'const user = await requireAuth\(([^)]*)\);', re.MULTILINE)

# Replacement pattern
NEW_PATTERN = r'''const { user, error } = await requireAuth(\1);
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }'''

def fix_file(filepath):
    """Fix requireAuth patterns in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has the pattern
        if 'const user = await requireAuth' not in content:
            return False

        # Check if already has the new pattern
        if 'const { user, error } = await requireAuth' in content:
            return False

        # Apply replacement
        new_content = OLD_PATTERN.sub(NEW_PATTERN, content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function to process all API route files."""
    api_dir = Path('src/app/api')
    fixed_files = []

    for filepath in api_dir.rglob('*.ts'):
        if 'route.ts' in filepath.name:
            if fix_file(filepath):
                fixed_files.append(str(filepath))
                print(f"Fixed: {filepath}")

    print(f"\nTotal files fixed: {len(fixed_files)}")
    if fixed_files:
        print("\nFixed files:")
        for f in fixed_files:
            print(f"  - {f}")

if __name__ == '__main__':
    main()
