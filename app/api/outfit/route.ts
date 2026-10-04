import { NextResponse } from "next/server";

type OutfitRequest = {
  occasion: string;
  vibe: string;
  timeOfDay: string;
  formality: string;
  description?: string;

  wardrobe: Array<{
    id: string;
    name: string | null;
    category: string | null;
    color: string | null;
    image_url: string;
    is_favorite?: boolean;
    is_in_laundry?: boolean;
  }>;

  preferences?: {
    avoid_items?: string[];
    avoid_colors?: string[];
    preferred_items?: string[];
    preferred_colors?: string[];
    preferred_styles?: string[];
    notes?: string[];
    temporary_avoidances?: Array<{
      term: string;
      until: string;
    }>;
  };

  feedback?: Array<{
    outfit_title: string | null;
    item_ids: string[];
    rating: "love" | "not_my_style";
    context?: Record<string, unknown>;
    created_at: string;
  }>;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as OutfitRequest;

    if (
      !Array.isArray(body.wardrobe) ||
      body.wardrobe.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Add some available clothes before generating an outfit.",
        },
        { status: 400 }
      );
    }

    const webhookUrl =
      process.env.N8N_OUTFIT_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The outfit webhook URL is not configured.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        currentDate: new Date()
          .toISOString()
          .slice(0, 10),
      }),
      cache: "no-store",
    });

    const responseText =
      await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseText ||
            "Closetly could not generate an outfit right now.",
        },
        { status: response.status }
      );
    }

    try {
      return NextResponse.json(
        JSON.parse(responseText)
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "The stylist returned an invalid response.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while generating the outfit.",
      },
      { status: 500 }
    );
  }
}