import { $ } from "../lib/Pen.js"

export function drawimg( img, x, y, sx=1.0, sy=sx, dir=[1.0, 0.0] )
{
    img.rotation = $.math.atan2(dir[1], dir[0]);
    img.position.x = x;
    img.position.y = y;
    img.draw(sx, sy);
}
