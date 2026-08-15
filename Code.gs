/**
 * Code.gs — Google Apps Script backend for the portfolio contact form.
 *
 * What it does:
 *  - doPost(e): receives a JSON submission from the site and appends it
 *    as a new row in the bound Google Sheet.
 *  - doGet(e): returns every stored submission as a JSON array, so the
 *    Admin Dashboard on the site can display them.
 *
 * Setup instructions are in the "GitHub & Deployment Guide" file, section 5.
 */

const SHEET_NAME = "Responses";

/**
 * Handles incoming contact-form submissions (POST requests).
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.name || "",
      data.email || "",
      data.subject || "",
      data.message || "",
    ]);

    return jsonResponse({ result: "success" });
  } catch (err) {
    return jsonResponse({ result: "error", message: err.message });
  }
}

/**
 * Serves all stored submissions as JSON (GET requests), for the Admin Dashboard.
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();

    // rows[0] is the header row: Timestamp, Name, Email, Subject, Message
    const responses = rows.slice(1).map((row) => ({
      timestamp: row[0],
      name: row[1],
      email: row[2],
      subject: row[3],
      message: row[4],
    }));

    // Most recent first, to match the site's local-storage ordering.
    responses.reverse();

    return jsonResponse(responses);
  } catch (err) {
    return jsonResponse({ result: "error", message: err.message });
  }
}

/**
 * Gets the "Responses" sheet, creating it with headers if it doesn't exist yet.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Email", "Subject", "Message"]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Small helper to return a proper JSON response.
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
