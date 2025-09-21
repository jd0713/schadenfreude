import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/entities - Get all entities
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        limit,
        offset,
      });
    }

    const { data, error, count } = await supabase
      .from('entities')
      .select('*', { count: 'exact' })
      .order('collected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch entities',
      },
      { status: 500 }
    );
  }
}

// POST /api/entities - Add new entity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.address || !body.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address and name are required',
        },
        { status: 400 }
      );
    }

    const entityData = {
      address: body.address,
      name: body.name,
      twitter: body.twitter || null,
      entity_type: body.entity_type || 'individual',
      chain: body.chain || 'ethereum',
      collected_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('entities')
      .insert(entityData)
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'Entity with this address already exists',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create entity',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/entities - Delete entity by address
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address parameter is required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('address', address);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Entity ${address} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete entity',
      },
      { status: 500 }
    );
  }
}