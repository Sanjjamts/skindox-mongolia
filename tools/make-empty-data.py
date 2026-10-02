#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Хоосон өгөгдлийн файл үүсгэх (загвар хуудсанд зориулсан)
=========================================================
Мэдээлэл нь хараахан ирээгүй хуудсанд зориулж хоосон <slug>-data.js
файл үүсгэнэ. Хуудас "Мэдээлэл хүлээгдэж байна" гэсэн төлөвөөр гарна.

Хэрэглээ:
    py tools/make-empty-data.py <slug> [<slug> ...]

Мэдээлэл ирэхэд энэ файлыг build-tier-data.py-аар дарж бичнэ:
    py tools/build-tier-data.py "<excel>" <slug> <sheet> [<sheet> ...]
"""

import io
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    for slug in sys.argv[1:]:
        out = os.path.join(HERE, slug + "-data.js")
        if os.path.exists(out):
            print("АЛГАСЛАА (аль хэдийн байна):", out)
            continue
        data = {"updated": "", "total": 0, "people": [], "rows": []}
        js = ("/* SKINDOX - Зарлах жагсаалт (хоосон загвар; мэдээлэл ирэхэд дарж бичнэ) */\n"
              "window.SKINDOX_ZARLAL=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
        with io.open(out, "w", encoding="utf-8") as f:
            f.write(js)
        print("OK ->", out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
