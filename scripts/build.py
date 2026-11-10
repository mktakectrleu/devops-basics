#!/usr/bin/env python3
"""Minimalny build GitHub Pages: kopiuje wyłącznie zawartość public/ do dist/."""
from pathlib import Path
import shutil
from validate import check

root = Path(__file__).resolve().parents[1]
check()
source = root / 'public'
target = root / 'dist'
if target.exists():
    shutil.rmtree(target)
shutil.copytree(source, target)
print(f'Gotowe: {target}')
