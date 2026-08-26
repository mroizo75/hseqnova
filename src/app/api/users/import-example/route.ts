import ExcelJS from "exceljs";

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HSEQ Nova";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Users", {
    headerFooter: {
      firstHeader: "User import — download, complete and import",
    },
  });

  sheet.columns = [
    { header: "email", key: "email", width: 32 },
    { header: "name", key: "name", width: 25 },
    { header: "role", key: "role", width: 22 },
    { header: "job title", key: "jobTitle", width: 22 },
    { header: "manager", key: "manager", width: 32 },
  ];

  sheet.addRow({
    email: "alex.site@example.co.uk",
    name: "Alex Site",
    role: "Employee",
    jobTitle: "Joiner",
    manager: "sam.manager@example.co.uk",
  });
  sheet.addRow({
    email: "sam.manager@example.co.uk",
    name: "Sam Manager",
    role: "Line manager",
    jobTitle: "Site supervisor",
    manager: "",
  });

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="hseq-nova-user-import.xlsx"',
      "Cache-Control": "no-cache",
    },
  });
}
