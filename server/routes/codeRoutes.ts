import express from "express";
import { exec } from "child_process";
import fs from "fs";

const router = express.Router();

// ✅ CHECK IF USER ALREADY PRINTED
const hasPrint = (code: string, language: string) => {
  if (language === "javascript") return code.includes("console.log");
  if (language === "python") return code.includes("print");
  if (language === "java") return code.includes("System.out.print");
  if (language === "perl") return code.includes("print");
  return false;
};

router.post("/run", async (req, res) => {
  const { code, language } = req.body;

  try {
    let fileName = "";
    let command = "";
    let finalCode = code; // ✅ IMPORTANT FIX

    // ================= JAVASCRIPT =================
    if (language === "javascript") {
      fileName = "temp.js";

      if (!hasPrint(code, language)) {
        finalCode += `\nconsole.log("Program executed");`;
      }

      fs.writeFileSync(fileName, finalCode);
      command = `node ${fileName}`;
    }

    // ================= PYTHON =================
    else if (language === "python") {
      fileName = "temp.py";

      if (!hasPrint(code, language)) {
        finalCode += `\nprint("Program executed")`;
      }

      fs.writeFileSync(fileName, finalCode);
      command = `python ${fileName}`;
    }

    // ================= JAVA =================
    else if (language === "java") {
      // 🔥 Extract class name safely
      const match = finalCode.match(/class\s+([A-Za-z0-9_]+)/);
      const className = match ? match[1] : "Main";

      fileName = `${className}.java`;

      // 🔥 Inject print if missing
      if (!hasPrint(finalCode, language)) {
        if (finalCode.includes("public static void main")) {
          finalCode = finalCode.replace(
            /public static void main\s*\([^\)]*\)\s*{/,
            (m) => m + '\nSystem.out.println("Program executed");'
          );
        } else {
          // If no main method, create one
          finalCode += `
public static void main(String[] args) {
    System.out.println("Program executed");
}`;
        }
      }

      fs.writeFileSync(fileName, finalCode);
      command = `javac ${fileName} && java ${className}`;
    }

    // ================= PERL =================
    else if (language === "perl") {
      fileName = "temp.pl";

      if (!hasPrint(code, language)) {
        finalCode += `\nprint "Program executed\\n";`;
      }

      fs.writeFileSync(fileName, finalCode);
      command = `perl ${fileName}`;
    }

    // ================= EXECUTE =================
    exec(command, (error, stdout, stderr) => {
      // 🧹 CLEANUP FILES
      try {
        if (fileName && fs.existsSync(fileName)) {
          fs.unlinkSync(fileName);
        }

        if (language === "java") {
          const classFile = fileName.replace(".java", ".class");
          if (fs.existsSync(classFile)) {
            fs.unlinkSync(classFile);
          }
        }
      } catch {}

      // ❌ ERROR
      if (error) {
        return res.json({ output: stderr || error.message });
      }

      // ⚠ STDERR
      if (stderr) {
        return res.json({ output: stderr });
      }

      // ⚠ NO OUTPUT
      if (!stdout || stdout.trim() === "") {
        return res.json({
          output: "No output (Tip: use console.log / print to display results)"
        });
      }

      // ✅ SUCCESS
      res.json({ output: stdout });
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;