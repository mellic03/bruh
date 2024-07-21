import { $ } from "../lib/Pen.js"
import { drawimg } from "./drawimg.js";
import { Player } from "./player.js";
import { Tentacle } from "./tentacle.js";
import { getWorld } from "./world.js";

$.use(draw);
$.width = 1000;
$.height = 1000;



let world = getWorld();
let player = new Player(200, 200, world);

let grassimg = $.loadImageToStamp(-2000, 200, "grass.jpg");

let env_floor = $.makeBoxCollider(-2000, 200, 8000, 500);
    env_floor.static     = true;
    env_floor.friction   = 0.0;
    env_floor.bounciness = 0.0;

world.environmentBoxes.push(env_floor);



function draw()
{
    world.playerCircles.collides(world.environmentBoxes);
    world.tentacleCircles.collides(world.environmentBoxes);

    if ($.mouse.rightDown)
    { 
        const mx = $.mouse.x - ($.camera.x - 500);
        const my = $.mouse.y - ($.camera.y - 500);

        for (let i=0; i<world.tentacles.length; i++)
        {
            world.tentacles[i].origin = [mx, my];
        }
    }

    for (let i=0; i<world.tentacles.length; i++)
    {
        const dx = $.math.random(-50, +50);
        const dy = $.math.random(-50, +50);
        world.tentacles[i].update(dx, dy);
        world.tentacles[i].draw();
    }

    $.shape.strokeWidth = 8;

    world.update();

    const dx = 1000 - (player.pos[0] + ($.camera.x));
    const dy = 1000 - (player.pos[1] + ($.camera.y));
    $.camera.x -= dx;
    $.camera.y -= dy;

    if ($.keys.down("H"))
    {
        $.camera.x += 1;
    }

    if ($.keys.down("G"))
    {
        $.camera.x -= 1;
    }

    for (let i=0; i<50; i++)
    {
        drawimg(grassimg, -2000 + 100*i, 450, 1000 * (1.0 / grassimg.w));
    }

    player.update();
    player.draw();

    // $.shape.rectangle(0, 500, 1000, 200);

}
