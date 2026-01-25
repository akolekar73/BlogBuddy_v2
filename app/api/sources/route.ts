import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Get sources for an article
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const savedOnly = searchParams.get('savedOnly') === 'true';

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    let query = supabase
      .from('sources')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false });

    if (savedOnly) {
      query = query.eq('saved', true);
    }

    const { data: sources, error } = await query;

    if (error) {
      console.error('Fetch sources error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sources' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sources: sources || [] });
  } catch (error) {
    console.error('Sources GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update source (save/unsave)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, saved } = body;

    if (!sourceId || typeof saved !== 'boolean') {
      return NextResponse.json(
        { error: 'sourceId and saved are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: source, error } = await supabase
      .from('sources')
      .update({ saved })
      .eq('id', sourceId)
      .select()
      .single();

    if (error) {
      console.error('Update source error:', error);
      return NextResponse.json(
        { error: 'Failed to update source' },
        { status: 500 }
      );
    }

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Sources PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete source
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'sourceId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', sourceId);

    if (error) {
      console.error('Delete source error:', error);
      return NextResponse.json(
        { error: 'Failed to delete source' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sources DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
