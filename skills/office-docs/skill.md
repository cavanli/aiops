---
name: office-docs
description: Process and manipulate Microsoft Office documents (Word, Excel, PowerPoint)
trigger: When user needs to create, read, modify, or analyze Word/Excel/PPT files
---

# Office Documents Skill

Handle Microsoft Office document operations including:

## Excel Operations
- Create/read/modify Excel files (.xlsx, .xls)
- Format cells, add formulas, charts
- Data analysis and reporting
- Use openpyxl or pandas for Python operations

## Word Operations  
- Create/read/modify Word documents (.docx)
- Format text, tables, images
- Generate reports and templates
- Use python-docx library

## PowerPoint Operations
- Create/read/modify presentations (.pptx)
- Add slides, text, images, charts
- Template generation
- Use python-pptx library

## Required Libraries
```bash
pip install openpyxl pandas python-docx python-pptx
```

## Usage Examples

### Excel
```python
from openpyxl import Workbook
wb = Workbook()
ws = wb.active
ws['A1'] = 'Data'
wb.save('output.xlsx')
```

### Word
```python
from docx import Document
doc = Document()
doc.add_heading('Title', 0)
doc.add_paragraph('Content')
doc.save('output.docx')
```

### PowerPoint
```python
from pptx import Presentation
prs = Presentation()
slide = prs.slides.add_slide(prs.slide_layouts[0])
prs.save('output.pptx')
```
