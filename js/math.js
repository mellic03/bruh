import { $ } from "../lib/Pen.js"


export function vec2_to_bearing( v )
{
    return ($.math.atan2(v[1], v[0]) + 90) % 360;
}


export function clamp( n, a, b )
{
    if (n < a)
    {
        return a;
    }

    if (n > b)
    {
        return b;
    }

    return n;
}
