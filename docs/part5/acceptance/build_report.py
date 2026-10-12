from pathlib import Path
import re
from html import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
TARGET = OUT / 'Part5_Backend_Deployment_Acceptance_EN.pdf'
INK = colors.HexColor('#183149')
BLUE = colors.HexColor('#1e6177')
BODY = ParagraphStyle('Body', fontName='Helvetica', fontSize=10, leading=14.5, textColor=INK,
                      spaceAfter=9, splitLongWords=True)
TITLE = ParagraphStyle('Title', parent=BODY, fontName='Helvetica-Bold', fontSize=23, leading=29,
                       spaceBefore=10, spaceAfter=12)
HEAD = ParagraphStyle('Head', parent=BODY, fontName='Helvetica-Bold', fontSize=14, leading=19,
                      textColor=BLUE, spaceBefore=12, spaceAfter=9, keepWithNext=True)
CELL = ParagraphStyle('Cell', parent=BODY, fontSize=9, leading=12.5, spaceAfter=0)
SMALL = ParagraphStyle('Small', parent=BODY, fontSize=8.4, leading=13, textColor=colors.HexColor('#587080'))

def p(text, style=BODY):
    text = text.replace('\u2013', '-').replace('\u2014', '-').replace('\u2011', '-')
    return Paragraph(escape(text), style)

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#dce4e9'))
    canvas.line(44, 40, A4[0]-44, 40)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#587080'))
    canvas.drawString(44, 26, 'SC6113  /  PART 5  /  2026-10-12')
    canvas.drawRightString(A4[0]-44, 26, str(doc.page))

lines = (ROOT / 'acceptance' / 'BACKEND_ACCEPTANCE_EN.md').read_text(encoding='utf-8').splitlines()
story = []
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line:
        i += 1
        continue
    if line.startswith('# '):
        story.extend([p('SC6113 GROUP PROJECT  |  PART 5', SMALL), p(line[2:], TITLE),
                      p('30 checks  /  29 passed  /  1 open P2 defect', HEAD)])
    elif line.startswith('## '):
        title = line[3:]
        if title in ['Acceptance coverage', 'Database persistence evidence', 'Defect P5-001']:
            story.append(PageBreak())
        story.append(p(title, HEAD))
    elif line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            parts = [x.strip() for x in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', x) for x in parts):
                rows.append([p(x, CELL) for x in parts])
            i += 1
        widths = [135, A4[0]-88-135] if len(rows[0]) == 2 else [114, 65, A4[0]-88-179]
        if 'Artifact' in lines[i - len(rows) - 1]:
            widths = [184, A4[0]-88-184]
        table = Table(rows, colWidths=widths, repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e5eff3')),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f4f7f9')]),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
            ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
            ('LINEBELOW',(0,0),(-1,0),0.7,colors.HexColor('#aac4d1')),
        ]))
        story.extend([table, Spacer(1, 11)])
        continue
    else:
        story.append(p(line))
    i += 1

doc = SimpleDocTemplate(str(TARGET), pagesize=A4, rightMargin=44, leftMargin=44,
                        topMargin=38, bottomMargin=55, title='SC6113 Backend and Deployment Acceptance',
                        author='SC6113 Group - Part 5 acceptance')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(str(TARGET))
text = '\n'.join(page.extract_text() for page in reader.pages)
assert 'P5-001' in text and '29' in text
assert not re.search(r'[\u3400-\u9fff\uac00-\ud7af\ufffd]', text)
print(str(TARGET))
print(f'Pages: {len(reader.pages)}; extracted characters: {len(text)}')
