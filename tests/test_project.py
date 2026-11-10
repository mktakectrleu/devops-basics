import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate import check, read_json


class ProjectTests(unittest.TestCase):
    def test_json_structure(self):
        check()

    def test_github_tab_has_sections(self):
        page = read_json('content/github/page.json')
        self.assertGreaterEqual(len(page['sections']), 3)

    def test_vscode_tab_has_sections(self):
        page = read_json('content/vscode/page.json')
        self.assertGreaterEqual(len(page['sections']), 5)

    def test_project_branding(self):
        site = read_json('content/site.json')
        self.assertEqual(site['title'], 'DevOps Basics')
        self.assertIn('vscode', [page['id'] for page in site['pages']])

    def test_local_tab_preserved(self):
        page = read_json('content/lokalnie/page.json')
        self.assertEqual(len(page['sections']), 10)


if __name__ == '__main__':
    unittest.main()
