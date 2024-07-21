import { $ } from "../lib/Pen.js"
import { Tentacle } from "./tentacle.js";


let instance = null;

export function getWorld()
{
    if (instance == null)
    {
        instance = new World;
    }

    return instance;
}




export class World
{
    playerCircles     = $.makeGroup();
    playerProjectiles = $.makeGroup();

    tentacleCircles   = $.makeGroup();
    tentacleBoxes     = $.makeGroup();

    environmentBoxes  = $.makeGroup();

    
    tentacle_images     = [];
    tentacle_hurtsounds = [];
    tentacles = [];

    constructor()
    {
        this.tentacle_hurtsounds.push($.loadSound("audio/hurt0.wav"));
        this.tentacle_hurtsounds.push($.loadSound("audio/hurt1.wav"));
        this.tentacle_hurtsounds.push($.loadSound("audio/hurt2.wav"));
        this.tentacle_hurtsounds.push($.loadSound("audio/hurt3.wav"));

        this.tentacle_images.push($.loadImageToStamp(250, 250, "img.jpg"));
        this.tentacle_images.push($.loadImageToStamp(250, 250, "face.png"));

        for (let i=0; i<4; i++)
        {
            const X = $.math.random(-1000, +1000);
            const Y = $.math.random(-1000, +1000);

            this.tentacles.push(new Tentacle(X, Y, 50, 32, 25, this.tentacle_images, this.tentacle_hurtsounds));
        }

    }


    _reset_projectile( p )
    {
        p.position.x = 0;
        p.position.y = -20000000;

        p.velocity.x = 0;
        p.velocity.y = 0;

    }


    _update_tentacle( tentacle )
    {
        let idx = 0;

        for (let segment of tentacle.segments)
        {
            for (let proj of this.playerProjectiles)
            {
                if (proj.collides(segment))
                {
                    tentacle.damage();
                    this.tentacles.push(tentacle.split(idx));

                    this._reset_projectile(proj);
                    break;
                }
            }

            idx += 1;
        }

    }



    update()
    {
        for (let tentacle of this.tentacles)
        {
            this._update_tentacle(tentacle);
        }


        for (let box of this.environmentBoxes)
        {
            for (let proj of this.playerProjectiles)
            {
                if (proj.collides(box))
                {
                    this._reset_projectile(proj);
                    break;
                }
            }
        }

    }
}

