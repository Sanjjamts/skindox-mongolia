#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel -> zarlal-data.js
=======================
Гишүүнчлэл түтгэлзүүлэх зарлалын жагсаалтыг Excel файлаас уншиж,
zarlal-shalgah.html хуудсанд хэрэглэгддэг `zarlal-data.js` файлыг үүсгэнэ.

Хэрэглээ:
    py tools/build-zarlal-data.py "C:\\path\\to\\Зарлах нэрс.xlsx"

Excel-ийн шаардлага:
    "Уригчтайгаа" нэртэй sheet, 1-р мөр нь толгой, багана нь:
    A: Гишүүний ID | B: Гишүүний нэр | C: Элссэн огноо |
    D: Статус | E: Уригчийн ID | F: Уригчийн нэр

Дараа нь:
    git add zarlal-data.js && git commit -m "Зарлал шинэчлэв" && git push
"""

import datetime
import io
import json
import os
import re
import sys

import openpyxl

SHEET = "Уригчтайгаа"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "zarlal-data.js")


def clean(v):
    return re.sub(r"\s+", " ", str(v).strip()) if v is not None else ""


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    src = sys.argv[1]

    wb = openpyxl.load_workbook(src, data_only=True)
    if SHEET not in wb.sheetnames:
        print('ERROR: "%s" sheet олдсонгүй. Sheets: %s' % (SHEET, wb.sheetnames))
        return 1
    ws = wb[SHEET]

    inviters, inv_index, rows = [], {}, []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r or not r[0]:
            continue
        mid, name, date, _status, iid, iname = (clean(x) for x in r[:6])
        if iid not in inv_index:
            inv_index[iid] = len(inviters)
            inviters.append([iid, iname])
        rows.append([mid, name, date, inv_index[iid]])

    dupes = len(rows) - len(set(r[0] for r in rows))
    if dupes:
        print("АНХААР: %d давхардсан ID байна." % dupes)

    data = {
        "updated": datetime.date.today().isoformat(),
        "total": len(rows),
        "inviters": inviters,
        "rows": rows,
    }
    js = ("/* SKINDOX - Зарлах жагсаалт (auto-generated, do not edit by hand) */\n"
          "window.SKINDOX_ZARLAL=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    with io.open(OUT, "w", encoding="utf-8") as f:
        f.write(js)

    print("OK -> %s (%d bytes, %d гишүүн, %d уригч)"
          % (OUT, os.path.getsize(OUT), len(rows), len(inviters)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
