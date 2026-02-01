import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Multiplier values that can appear on numbers
const MULTIPLIER_VALUES = [5, 10, 20, 50, 100, 200, 500, 1000]

// Generate random multipliers for some numbers
function generateMultipliers(): Record<number, number> {
  const multipliers: Record<number, number> = {}
  
  // 30% chance to have multipliers this round
  if (Math.random() < 0.30) {
    // Pick 1-3 random numbers to have multipliers
    const numMultipliers = Math.floor(Math.random() * 3) + 1
    const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    
    for (let i = 0; i < numMultipliers && availableNumbers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length)
      const number = availableNumbers.splice(randomIndex, 1)[0]
      
      // Lower multipliers are more common
      const multiplierIndex = Math.floor(Math.pow(Math.random(), 2) * MULTIPLIER_VALUES.length)
      multipliers[number] = MULTIPLIER_VALUES[multiplierIndex]
    }
  }
  
  return multipliers
}

// Generate RNG result - fair random 0-14
function generateResult(): number {
  return Math.floor(Math.random() * 15)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action } = await req.json()

    if (action === 'get_state') {
      // Get current game state
      const { data: state } = await supabase
        .from('double_x_game_state')
        .select('*')
        .eq('id', 1)
        .single()

      // Get recent rounds
      const { data: rounds } = await supabase
        .from('double_x_rounds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      return new Response(
        JSON.stringify({ state, rounds }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'advance_game') {
      // Get current state
      const { data: state } = await supabase
        .from('double_x_game_state')
        .select('*')
        .eq('id', 1)
        .single()

      if (!state) {
        throw new Error('Game state not found')
      }

      const now = new Date()
      const phaseEndsAt = new Date(state.phase_ends_at)

      // Check if phase should advance
      if (now >= phaseEndsAt) {
        if (state.current_phase === 'betting') {
          // Generate result and multipliers
          const result = generateResult()
          const multipliers = generateMultipliers()

          // Transition to spinning phase (5 seconds)
          await supabase
            .from('double_x_game_state')
            .update({
              current_phase: 'spinning',
              phase_ends_at: new Date(now.getTime() + 5000).toISOString(),
              current_result: result,
              current_multipliers: multipliers,
              updated_at: now.toISOString()
            })
            .eq('id', 1)

          return new Response(
            JSON.stringify({ success: true, phase: 'spinning', result, multipliers }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else if (state.current_phase === 'spinning') {
          // Save round to history
          await supabase
            .from('double_x_rounds')
            .insert({
              result: state.current_result,
              multipliers: state.current_multipliers
            })

          // Transition to result phase (3 seconds to show result)
          await supabase
            .from('double_x_game_state')
            .update({
              current_phase: 'result',
              phase_ends_at: new Date(now.getTime() + 3000).toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', 1)

          return new Response(
            JSON.stringify({ success: true, phase: 'result' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else if (state.current_phase === 'result') {
          // Start new betting phase (15 seconds)
          const newMultipliers = generateMultipliers()

          await supabase
            .from('double_x_game_state')
            .update({
              current_phase: 'betting',
              phase_ends_at: new Date(now.getTime() + 15000).toISOString(),
              current_result: null,
              current_multipliers: newMultipliers,
              updated_at: now.toISOString()
            })
            .eq('id', 1)

          return new Response(
            JSON.stringify({ success: true, phase: 'betting', multipliers: newMultipliers }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ success: true, phase: state.current_phase, message: 'No advance needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
