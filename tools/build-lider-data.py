#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel -> nkekkpn5wc-data.js
=============================
Цолтой (Polaris / Royal Polaris / Crown Polaris) гишүүдийн эрсдэлийн
жагсаалтыг Excel-ээс уншиж, nkekkpn5wc.html хуудасны өгөгдлийг үүсгэнэ.

Хэрэглээ:
    py tools/build-lider-data.py "C:\\path\\to\\zarlah member_new lider.xlsx"

Excel-ийн шаардлага — эхний sheet дээр, 6-р мөр нь толгой, 7-р мөрөөс өгөгдөл.
Багана нь (A баганад мөрийн дугаар байна):
    B: ID                       C: Name                    D: Status (цол)
    E: Өөрийн ХА дүн            F: Уригчийн ХА үнийн дүн   G: Шууд урилгын PV
    H: Идэвхи                   I: Уригч/уригчийн уригч ROYAL,CROWN
    J: Шууд уригч Polaris       K: Уригчийн ID             L: Уригч
    M: Спонсрын ID              N: Спонсор                 O: Уригчийн уригч ID
    P: Уригчийн уригч нэр

Дараа нь:
    git add nkekkpn5wc-data.js
    git commit -m "Лидерийн зарлал шинэчлэв"
    git push origin main
"""

import collections
import datetime
import io
import json
import os
import re
import sys

import openpyxl

HEADER_ROW = 6
MISSING = ("", "#N/A", "#N/A!", "#VALUE!", "#REF!", "NONE", "NULL")

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "nkekkpn5wc-data.js")


def clean(v):
    return re.sub(r"\s+", " ", str(v).strip()) if v is not None else ""


def blank(v):
    return v.upper() in MISSING


def num(v):
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return 0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    src = sys.argv[1]

    wb = openpyxl.load_workbook(src, data_only=True)
    ws = wb.worksheets[0]
    print('Sheet: "%s"' % ws.title)

    rows = []
    for r in ws.iter_rows(min_row=HEADER_ROW + 1, values_only=True):
        if not r or not r[1]:
            continue
        c = list(r) + [None] * (16 - len(r))
        rows.append([
            clean(c[1]),                                  # 0 ID
            clean(c[2]),                                  # 1 нэр
            clean(c[3]),                                  # 2 цол
            clean(c[7]),                                  # 3 идэвхи
            num(c[4]),                                    # 4 өөрийн ХА дүн
            "" if blank(clean(c[10])) else clean(c[10]),  # 5 уригчийн ID
            clean(c[11]),                                 # 6 уригчийн нэр
            "" if blank(clean(c[12])) else clean(c[12]),  # 7 спонсорын ID
            clean(c[13]),                                 # 8 спонсорын нэр
            "" if blank(clean(c[14])) else clean(c[14]),  # 9 уригчийн уригч ID
            clean(c[15]),                                 # 10 уригчийн уригч нэр
            clean(c[8]),                                  # 11 дээд Royal/Crown
            clean(c[9]),                                  # 12 шууд уригсан Polaris
        ])

    dupes = len(rows) - len(set(r[0] for r in rows))
    if dupes:
        print("АНХААР: %d давхардсан ID байна." % dupes)

    data = {
        "updated": datetime.date.today().isoformat(),
        "total": len(rows),
        "rows": rows,
    }
    js = ("/* SKINDOX - Цолтой гишүүдийн зарлал (auto-generated, do not edit by hand) */\n"
          "window.SKINDOX_LIDER=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    with io.open(OUT, "w", encoding="utf-8") as f:
        f.write(js)

    print("OK -> %s (%d bytes, %d гишүүн)" % (OUT, os.path.getsize(OUT), len(rows)))
    print("   цол:", dict(collections.Counter(r[2] for r in rows)))
    print("   идэвхи:", dict(collections.Counter(r[3] for r in rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
