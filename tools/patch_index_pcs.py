# -*- coding: utf-8 -*-
import re
from pathlib import Path

path = Path(r"D:\OSPanel\domains\GameTach\index.html")
c = path.read_text(encoding="utf-8")

items = [
    ("CYBER GAMER", "pc-01.png"),
    ("TITAN ULTRA", "pc-06.png"),
    ("STORM RGB", "pc-05.png"),
]

for title, img in items:
    pattern = (
        r'<div class="build-image">\s*'
        r'<div style="background: var\(--bg-primary\); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 8px;">\s*'
        r'<div style="text-align: center;">\s*'
        r'<div style="font-size: 48px;">.*?</motion>\s*'
        rf'<p style="color: var\(--text-secondary\); margin-top: 10px;">{re.escape(title)}</p>\s*'
        r'</div>\s*</div>\s*</div>'
    )
    pattern = pattern.replace("</motion>", "</div>")
    repl = (
        f'<div class="build-image pc-photo-frame">\n'
        f'                            <img src="assets/pcs/{img}" alt="{title}" loading="lazy">\n'
        f"                        </div>"
    )
    new_c, n = re.subn(pattern, repl, c, count=1, flags=re.DOTALL)
    print(f"{title}: {n}")
    if n == 1:
        c = new_c

path.write_text(c, encoding="utf-8")
