"""Generador de PDF "Diagnóstico municipal" (plantilla Economía y empleo).

Requiere:
    pip install reportlab

Uso rápido:
    python generate_municipio_pdf.py data/indicadores_basicos.json data/economia_empleo.json 02001 salida.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
import json
import sys
from pathlib import Path


def load_by_adm2(path, adm2_code, is_list=True):
  data = json.loads(Path(path).read_text(encoding="utf-8"))
  if is_list:
    for row in data:
      if row.get("adm2_code") == adm2_code:
        return row
    return None
  else:
    return data.get(adm2_code)


def draw_header(c, municipio, provincia):
  c.setFont("Helvetica-Bold", 14)
  c.drawString(20 * mm, 280 * mm, f"Tu municipio en cifras - {municipio}")
  c.setFont("Helvetica", 9)
  c.drawString(20 * mm, 274 * mm, f"Provincia: {provincia}")
  c.drawRightString(190 * mm, 280 * mm, "ONE · Censo 2022 · DEE 2024")


def draw_economia_empleo(c, econ, y_start=260 * mm):
  c.setFont("Helvetica-Bold", 11)
  c.drawString(20 * mm, y_start, "Economía y empleo")
  y = y_start - 6 * mm
  dee = econ.get("dee_2024", {})
  lm = econ.get("labor_market_2022", {})

  c.setFont("Helvetica", 9)
  c.drawString(22 * mm, y, "Total de establecimientos (DEE 2024):")
  c.setFont("Helvetica-Bold", 9)
  c.drawString(
      80 * mm,
      y,
      str(dee.get("total_establishments", "s/d")),
  )
  y -= 6 * mm

  c.setFont("Helvetica", 9)
  c.drawString(22 * mm, y, "Participación laboral 2022:")
  c.setFont("Helvetica-Bold", 9)
  val = lm.get("participation_rate_total")
  c.drawString(80 * mm, y, f"{val:.1f}%" if isinstance(val, (int, float)) else "s/d")
  y -= 5 * mm

  c.setFont("Helvetica", 9)
  c.drawString(22 * mm, y, "Tasa de desempleo 2022:")
  c.setFont("Helvetica-Bold", 9)
  val = lm.get("unemployment_rate_total")
  c.drawString(80 * mm, y, f"{val:.1f}%" if isinstance(val, (int, float)) else "s/d")
  y -= 8 * mm

  # Rango de empleo
  c.setFont("Helvetica-Bold", 9)
  c.drawString(22 * mm, y, "Empresas por rango de empleo (DEE 2024)")
  y -= 5 * mm
  c.setFont("Helvetica", 8)
  bands = (dee.get("employment_size_bands") or [])
  for band in bands:
    label = band.get("label") or band.get("range")
    v = band.get("establishments")
    c.drawString(24 * mm, y, f"- {label}: {v if v is not None else 's/d'}")
    y -= 4 * mm

  # Mercado laboral
  y -= 4 * mm
  c.setFont("Helvetica-Bold", 9)
  c.drawString(22 * mm, y, "Mercado laboral (Censo 2022)")
  y -= 5 * mm
  c.setFont("Helvetica", 8)
  pea = lm.get("pea_total")
  occ = lm.get("occupied_total")
  des = lm.get("unemployed_total")
  c.drawString(24 * mm, y, f"PEA total: {pea if pea is not None else 's/d'}")
  y -= 4 * mm
  c.drawString(24 * mm, y, f"Población ocupada: {occ if occ is not None else 's/d'}")
  y -= 4 * mm
  c.drawString(24 * mm, y, f"Población desocupada: {des if des is not None else 's/d'}")


def main(indicadores_path, econ_path, adm2_code, output_path):
  ind = load_by_adm2(indicadores_path, adm2_code, is_list=True)
  econ = load_by_adm2(econ_path, adm2_code, is_list=True)

  if not ind:
    raise SystemExit(f"No se encontraron indicadores básicos para {adm2_code}")
  if not econ:
    raise SystemExit(f"No se encontraron datos de economía y empleo para {adm2_code}")

  municipio = ind.get("municipio", adm2_code)
  provincia = ind.get("provincia", "")

  c = canvas.Canvas(output_path, pagesize=A4)
  draw_header(c, municipio, provincia)
  draw_economia_empleo(c, econ)
  c.showPage()
  c.save()
  print(f"PDF generado en {output_path}")


if __name__ == "__main__":
  if len(sys.argv) != 5:
    print(
        "Uso: python generate_municipio_pdf.py "
        "public/data/indicadores_basicos.json public/data/economia_empleo.json ADM2_CODE salida.pdf"
    )
    raise SystemExit(1)
  _, indicadores_path, econ_path, adm2_code, output_path = sys.argv
  main(indicadores_path, econ_path, adm2_code, output_path)
