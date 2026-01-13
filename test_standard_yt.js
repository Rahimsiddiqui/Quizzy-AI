import { YoutubeTranscript } from "youtube-transcript";

const videoId = "jNQXAC9IVRw"; // "Me at the zoo"

async function testStandard() {
  console.log(`Testing standard video: ${videoId}`);

  // 1. Library Test
  try {
    console.log("1. Library Attempt...");
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (items && items.length) {
      console.log("   SUCCESS! Transcript fetched via Library.");
      return;
    } else {
      console.log("   Library returned no items.");
    }
  } catch (err) {
    console.log("   Library Failed:", err.message);
  }

  // 2. Manual Fallback Test (mimicking aiHelper.js)
  try {
    console.log("\n2. Manual Fallback Attempt...");
    const USER_AGENT =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";

    const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    const html = await pageResp.text();

    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);
    if (!match) {
      console.log("   FAILED: ytInitialPlayerResponse not found");
      return;
    }

    const playerJson = JSON.parse(match[1]);
    const captionTracks =
      playerJson?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks) {
      console.log("   FAILED: No caption tracks found in format.");
      return;
    }

    console.log(`   Found ${captionTracks.length} tracks.`);
    const track =
      captionTracks.find((t) => t.languageCode === "en") || captionTracks[0];
    const baseUrl = track.baseUrl.replace(/\\u0026/g, "&");

    console.log("   Fetching content...");
    const xmlResp = await fetch(baseUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    const xml = await xmlResp.text();

    if (xml.length > 100) {
      console.log("   SUCCESS! Manual fallback fetched content.");
      console.log("   Preview:", xml.substring(0, 200).replace(/</g, "&lt;"));
    } else {
      console.log("   FAILED: Content body empty.");
    }
  } catch (err) {
    console.error("   Manual Fallback Error:", err);
  }
}

testStandard();
