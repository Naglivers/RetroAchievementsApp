from pathlib import Path
import openpyxl

src = Path(r"C:\Users\nagli\Downloads\company-form-lucas-neves-ventura.xlsx")
dst = Path(r"C:\Users\nagli\OneDrive\Documents\GitHub\RetroAchievementsApp\company-form-lucas-neves-ventura-preenchido.xlsx")
wb = openpyxl.load_workbook(src)
ws = wb["Form"]

values = {
    "D14": "Lucas Neves Ventura",
    "D15": "Proprietário",
    "D16": "lucasventura06@gmail.com",
    "D17": "(11) 2501-4821",
    "D18": "Não",
    "D19": "NA",
    "D20": "NA", "D21": "NA", "D22": "NA", "D23": "NA",
    "D26": "53.262.146 Lucas Neves Ventura",
    "D27": "NA",
    "D28": "53.262.146/0001-71",
    "D29": "NA",
    "D30": "R. Pretoria",
    "D31": "541",
    "D32": "Casa 8",
    "D33": "São Paulo",
    "D34": "SP",
    "D35": "03416-000",
    "D36": "(11) 2501-4821",
    "D37": None,
    "D38": "lucasventura06@gmail.com",
    "D42": "NA",
    "D43": "NA",
    "D47": "19/12/2023",
    "D48": "NA",
    "D49": "NA",
    "D52": "NA", "D53": "NA", "D54": "NA", "D55": "NA", "D56": "NA", "D57": "NA",
    "D65": "Lucas Neves Ventura",
    "D66": "Proprietário",
    "D67": "19/12/2023",
    "D68": "lucasventura06@gmail.com",
    "D77": "NA", "D78": "NA", "D79": "NA", "D80": "NA", "D81": "NA",
    "D89": "NA", "D90": "NA", "D91": "NA",
    "D97": "Não",
    "D98": "NA",
    "D99": "NA", "D100": "NA",
    "D106": "NA", "D109": "NA", "D110": "NA", "D111": "NA", "D112": "NA",
    "D117": "São Paulo",
    "D118": "NA",
    "D119": "19/12/2023",
    "D120": "NA", "D121": "NA", "D122": "NA", "D123": "NA",
    "D129": "Lucas Neves Ventura",
    "D130": "100%",
    "D134": "NA",
    "D135": "47.51-2-01 - Comércio varejista especializado de equipamentos e suprimentos de informática",
    "D136": "NA", "D137": "NA", "D138": "NA", "D139": "NA",
    "D140": "Não", "D141": "NA", "D142": "0%", "D143": "NA",
    "D144": "Não", "D145": "NA", "D146": "0%", "D147": "NA", "D148": "0%",
    "D149": "NA", "D150": "NA", "D151": "NA", "D152": "Não", "D153": "NA", "D154": "NA",
    "D159": "NA", "D160": "NA", "D161": "NA", "D162": "NA", "D163": "NA",
    "D168": "Não", "D169": "Não", "D170": "Não", "D171": "Não",
    "D174": "Não", "D175": "NA", "D176": "NA", "D177": "NA", "D178": "NA",
}

for cell, value in values.items():
    # Algumas linhas de pergunta ocupam a célula inteira, inclusive a área de resposta.
    # Nesses casos, a pergunta já indica que não há resposta aplicável.
    if isinstance(ws[cell], openpyxl.cell.cell.MergedCell):
        continue
    ws[cell] = value

wb.save(dst)
print(dst)
