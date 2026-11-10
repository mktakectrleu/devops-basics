#!/usr/bin/env python3
"""Walidacja spójności menu, sekcji, podsekcji i komend bez dodatkowych bibliotek."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'public'
SLUG = re.compile(r'^[a-z0-9][a-z0-9_-]*$')


def read_json(relative):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT.resolve()) or path.suffix != '.json':
        raise ValueError(f'Niebezpieczna ścieżka JSON: {relative}')
    if not path.is_file():
        raise ValueError(f'Brak pliku: {relative}')
    return json.loads(path.read_text(encoding='utf-8'))


def check():
    for name in ('index.html', 'app.js', 'styles.css'):
        if not (ROOT / name).is_file():
            raise ValueError(f'Brakuje public/{name}')
    site = read_json('content/site.json')
    if not isinstance(site.get('pages'), list) or not site['pages']:
        raise ValueError('Brak listy pages')
    ids = set()
    command_count = 0
    section_count = 0
    for item in site['pages']:
        pid = item['id']
        if not SLUG.fullmatch(pid) or pid in ids:
            raise ValueError(f'Błędne/powtórzone id zakładki: {pid}')
        ids.add(pid)
        rel = item['file']
        page = read_json(rel)
        if page['id'] != pid:
            raise ValueError(f'ID strony nie zgadza się: {rel}')
        base = Path(rel).parent
        section_ids = set()
        for sec_rel in page['sections']:
            sec = read_json(base / sec_rel)
            sid = sec['id']
            if not SLUG.fullmatch(sid) or sid in section_ids:
                raise ValueError(f'Błędne/powtórzone ID sekcji: {sid}')
            section_ids.add(sid)
            section_count += 1
            if not isinstance(sec.get('title'), str) or not sec['title'].strip():
                raise ValueError(f'Brak tytułu w {sid}')
            groups = set()
            for group in sec.get('subsections', []):
                gid = group['id']
                if not SLUG.fullmatch(gid) or gid in groups:
                    raise ValueError(f'Błędne/powtórzone ID podsekcji {gid} w {sid}')
                groups.add(gid)
                if not group.get('title'):
                    raise ValueError(f'Brak tytułu podsekcji: {gid}')
                for entry in group.get('commands', []):
                    if not all(isinstance(entry.get(k), str) and entry[k].strip() for k in ('command','description')):
                        raise ValueError(f'Pusta komenda/opis w {sid}/{gid}')
                    command_count += 1
    if site.get('defaultPage') not in ids:
        raise ValueError('defaultPage nie istnieje')
    if command_count < 94:
        raise ValueError(f'Brakuje pierwotnych komend: tylko {command_count}')
    print(f'OK: {len(ids)} zakładek, {section_count} sekcji, {command_count} komend.')


if __name__ == '__main__':
    check()
