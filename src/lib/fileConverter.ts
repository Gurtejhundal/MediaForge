export function csvToJson(csv: string): any[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const obj: any = {};
    const currentline = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j] || "";
    }
    result.push(obj);
  }
  return result;
}

export function jsonToCsv(jsonObj: any): string {
  const arr = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
  if (arr.length === 0) return "";
  const headers = Object.keys(arr[0]);
  const csvRows = [];
  csvRows.push(headers.join(","));
  for (const row of arr) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + val).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}

export function jsonToXml(jsonObj: any, rootName = "root"): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
  
  function toXml(obj: any, indent = "  "): string {
    let part = "";
    if (typeof obj !== "object" || obj === null) {
      return String(obj);
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        part += `${indent}<item>\n${toXml(item, indent + "  ")}\n${indent}</item>\n`;
      }
    } else {
      for (const key of Object.keys(obj)) {
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
        const val = obj[key];
        if (typeof val === "object" && val !== null) {
          part += `${indent}<${cleanKey}>\n${toXml(val, indent + "  ")}\n${indent}</${cleanKey}>\n`;
        } else {
          part += `${indent}<${cleanKey}>${val}</${cleanKey}>\n`;
        }
      }
    }
    return part;
  }
  
  xml += toXml(jsonObj);
  xml += `</${rootName}>`;
  return xml;
}

export function xmlToJson(xml: string): any {
  const result: any = {};
  const tagRegex = /<([^>]+)>([^<]*)<\/\1>/g;
  let match;
  let hasMatches = false;
  while ((match = tagRegex.exec(xml)) !== null) {
    hasMatches = true;
    const tag = match[1];
    const value = match[2].trim();
    if (result[tag]) {
      if (Array.isArray(result[tag])) {
        result[tag].push(value);
      } else {
        result[tag] = [result[tag], value];
      }
    } else {
      result[tag] = value;
    }
  }
  if (!hasMatches) {
    const cleanXml = xml.replace(/<\?xml.*\?>/g, "").trim();
    const wrapperMatch = cleanXml.match(/<([^>]+)>([\s\S]*)<\/\1>/);
    if (wrapperMatch) {
      const content = wrapperMatch[2].trim();
      return xmlToJson(content);
    }
    return xml;
  }
  return result;
}

export function jsonToYaml(obj: any, indent = ""): string {
  let yaml = "";
  if (typeof obj !== "object" || obj === null) {
    return ` ${String(obj)}\n`;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === "object" && item !== null) {
        yaml += `${indent}-\n${jsonToYaml(item, indent + "  ")}`;
      } else {
        yaml += `${indent}- ${String(item)}\n`;
      }
    }
  } else {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "object" && val !== null) {
        yaml += `${indent}${key}:\n${jsonToYaml(val, indent + "  ")}`;
      } else {
        yaml += `${indent}${key}: ${String(val)}\n`;
      }
    }
  }
  return yaml;
}

export function yamlToJson(yaml: string): any {
  const lines = yaml.split("\n");
  const result: any = {};
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("#")) continue;
    const separatorIdx = cleanLine.indexOf(":");
    if (separatorIdx > 0) {
      const key = cleanLine.substring(0, separatorIdx).trim();
      const val = cleanLine.substring(separatorIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

export function mdToHtml(md: string): string {
  let html = md;
  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Bold/Italics
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  // Lists
  html = html.replace(/^\s*-\s*(.*$)/gim, '<li>$1</li>');
  
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    if (p.trim().startsWith("<h") || p.trim().startsWith("<ul") || p.trim().startsWith("<li")) {
      return p;
    }
    return `<p>${p.trim()}</p>`;
  }).join("\n");
  return html;
}

export function textToPdf(text: string): Buffer {
  const lines = text.split('\n');
  let pdf = '%PDF-1.4\n';
  const objects: { id: number; content: string }[] = [];
  
  function addObject(content: string) {
    const id = objects.length + 1;
    objects.push({ id, content: `${id} 0 obj\n${content}\nendobj\n` });
    return id;
  }
  
  const fontId = addObject('<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>');
  
  let textStream = 'BT\n/F1 12 Tf\n14 TL\n50 750 Td\n';
  for (const line of lines) {
    const escapedLine = line
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    textStream += `(${escapedLine}) Tj T*\n`;
  }
  textStream += 'ET';
  
  const streamId = addObject(`<<\n/Length ${textStream.length}\n>>\nstream\n${textStream}\nendstream`);
  
  const pageId = addObject(`<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 ${fontId} 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents ${streamId} 0 R\n>>`);
  
  const pagesObj = `4 0 obj\n<<\n/Type /Pages\n/Kids [${pageId} 0 R]\n/Count 1\n>>\nendobj\n`;
  const catalogObj = `5 0 obj\n<<\n/Type /Catalog\n/Pages 4 0 R\n>>\nendobj\n`;
  
  const offsets: Record<number, number> = {};
  
  function write(str: string) {
    const offset = pdf.length;
    pdf += str;
    return offset;
  }
  
  for (const obj of objects) {
    offsets[obj.id] = write(obj.content);
  }
  
  offsets[4] = write(pagesObj);
  offsets[5] = write(catalogObj);
  
  const xrefOffset = pdf.length;
  
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 3}\n`;
  pdf += '0000000000 65535 f \n';
  
  for (let i = 1; i <= objects.length + 2; i++) {
    const off = offsets[i];
    const offStr = String(off).padStart(10, '0');
    pdf += `${offStr} 00000 n \n`;
  }
  
  pdf += `trailer\n<<\n/Size ${objects.length + 3}\n/Root 5 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  
  return Buffer.from(pdf, 'binary');
}
