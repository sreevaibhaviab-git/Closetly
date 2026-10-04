import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    const webhookUrl =
      process.env.N8N_STYLIST_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Stylist webhook not configured.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            text ||
            "AI Stylist failed.",
        },
        {
          status: response.status,
        }
      );
    }

    try {
      return NextResponse.json(
        JSON.parse(text)
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid response from AI Stylist.",
        },
        {
          status: 500,
        }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}