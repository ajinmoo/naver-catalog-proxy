import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());

app.get("/api/naver", async (req, res) => {
  const { catalogId } = req.query;
  if (!catalogId) return res.status(400).json({ error: "catalogId required" });

  try {
    const url = `https://search.shopping.naver.com/catalog/${catalogId}`;
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    const content = await page.content();
    const matches = [...content.matchAll(/"price":"?([\d,]+)"?.*?"mallName":"(.*?)"/g)];

    const sellers = matches.map(m => ({
      price: parseInt(m[1].replace(/,/g, '')),
      mall: m[2]
    }));

    const sorted = sellers
      .filter(s => !isNaN(s.price))
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);

    await browser.close();
    res.json(sorted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Naver proxy running on " + PORT));
