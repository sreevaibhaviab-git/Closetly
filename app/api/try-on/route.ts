import { NextResponse } from "next/server";

type TryOnRequest = {
  avatarUrl: string;
  outfitTitle: string;

  occasion?: string | null;
  vibe?: string | null;
  timeOfDay?: string | null;
  formality?: string | null;
  description?: string | null;

  items: Array<{
    id: string;
    name: string | null;
    category: string | null;
    color: string | null;
    image_url: string;
  }>;
};

type N8nTryOnResponse = {
  success?: boolean;
  imageUrl?: string;
  image_url?: string;
  output?: string;
  message?: string;
};

export async function POST(request: Request) {
  let responseText = "";

  try {
    const body = (await request.json()) as TryOnRequest;

    if (
      !body.avatarUrl ||
      typeof body.avatarUrl !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Your permanent avatar is missing.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This outfit does not contain any wardrobe items.",
        },
        { status: 400 }
      );
    }

    const validItems = body.items.filter(
      (item) =>
        item &&
        typeof item.image_url === "string" &&
        item.image_url.trim().length > 0
    );

    if (validItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected outfit items do not have usable images.",
        },
        { status: 400 }
      );
    }

    const webhookUrl =
      process.env.N8N_TRY_ON_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Virtual Try-On webhook URL is not configured.",
        },
        { status: 500 }
      );
    }

    console.log(
      "TRY-ON WEBHOOK URL:",
      webhookUrl
    );

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_url: body.avatarUrl,

        outfit_title:
          body.outfitTitle || "Closetly outfit",

        occasion: body.occasion || null,
        vibe: body.vibe || null,
        time_of_day: body.timeOfDay || null,
        formality: body.formality || null,
        description: body.description || null,

        items: validItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          color: item.color,
          image_url: item.image_url,
        })),

        instructions: [
          "Use the avatar as the identity and body reference.",
          "Preserve the person's facial identity, body proportions and skin tone.",
          "Dress the avatar only in the supplied wardrobe items.",
          "Do not invent replacement clothes.",
          "Keep garment colors, patterns and visible design details faithful to the source images.",
          "Create a realistic full-body fashion try-on image.",
          "Use a clean neutral background.",
          "Do not add text, logos, watermarks or extra people.",
        ],

        current_date: new Date()
          .toISOString()
          .slice(0, 10),
      }),
      cache: "no-store",
    });

    responseText = await response.text();

    console.log(
      "N8N RAW RESPONSE:",
      response.status,
      responseText
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseText ||
            "Closetly could not generate the Virtual Try-On.",
        },
        {
          status: response.status || 502,
        }
      );
    }

    if (!responseText.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "n8n returned an empty response.",
        },
        { status: 502 }
      );
    }

    let data: N8nTryOnResponse;

    try {
      data = JSON.parse(
        responseText
      ) as N8nTryOnResponse;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: `N8N returned non-JSON: ${responseText}`,
        },
        { status: 502 }
      );
    }

    const imageUrl =
      data.imageUrl ||
      data.image_url ||
      data.output;

    if (
      !imageUrl ||
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            data.message ||
            `The workflow did not return an image. Response: ${responseText}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error(
      "TRY-ON ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : responseText
              ? `Raw n8n response: ${responseText}`
              : "Something went wrong while generating the Virtual Try-On.",
      },
      { status: 500 }
    );
  }
}