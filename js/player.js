import { $ } from "../lib/Pen.js"
import { vec2_add, vec2_mult, vec2_normalize, vec2_magSq } from "../vec2.js";

import { BodyPart, PlayerArm, PlayerLeg } from "./bodypart.js"
import  './objectmanager.js'
import * as OM from "./objectmanager.js";
import { getWorld } from "./world.js";
import { drawimg } from "./drawimg.js";


export class Player
{
    pos   = [10, 10];
    speed = 1.0;

    images = [];
    headimg;
    pewsounds = [];

    MAX_PROJECTILES  = 32;
    PROJECTILE_SPEED = 150;
    projectile_idx  = 0;
    projectiles     = [];

    objects = new OM.ObjectManager;
    drawables = [];

    bodyparts = [];
    legs      = [];

    grounded      = false;
    airtime       = 0.0;
    grounded_y    = 0.0;

    yvel      = 0.0

    collider;
    col_xoff = 0;
    col_yoff = -180;

    prev_left_down = false;

    torso;
    arm_R;

    constructor(x, y)
    {
        this.pos = [x, y];

        this.pewsounds.push($.loadSound("audio/pew0.wav"));
        this.pewsounds.push($.loadSound("audio/pew1.wav"));
        this.pewsounds.push($.loadSound("audio/pew2.wav"));

        let head   = new BodyPart(0, -50, 0.15, 0.15, "michael.png");
        this.torso  = new BodyPart(0, 40, 0.08, 0.12, "face.png");
        let leg_L  = new PlayerLeg(-25, 80, true);
        let leg_R  = new PlayerLeg(+25, 80, false);
        this.arm_R = new PlayerArm(+25, 0);

        // this.objects.addObject(weapon, OM.OBJECT_UPDATEABLE | OM.OBJECT_DRAWABLE | OM.OBJECT_MOVEABLE);
        this.objects.addObject(head,   OM.OBJECT_UPDATEABLE | OM.OBJECT_DRAWABLE);
        this.objects.addObject(this.torso,  OM.OBJECT_UPDATEABLE | OM.OBJECT_DRAWABLE);
        this.objects.addObject(leg_L,  OM.OBJECT_UPDATEABLE | OM.OBJECT_DRAWABLE | OM.OBJECT_MOVEABLE);
        this.objects.addObject(leg_R,  OM.OBJECT_UPDATEABLE | OM.OBJECT_DRAWABLE | OM.OBJECT_MOVEABLE);
        // this.objects.addObject(arm_L,  OM.OBJECT_UPDATEABLE | OM.OBJECT_DRAWABLE | OM.OBJECT_MOVEABLE);
        this.objects.addObject(this.arm_R,  OM.OBJECT_UPDATEABLE | OM.OBJECT_DRAWABLE | OM.OBJECT_MOVEABLE);


        for (let i=0; i<this.MAX_PROJECTILES; i++)
        {
            let p = $.makeCircleCollider(-2000, -2000, 10);
                p.friction = 0;

            this.projectiles.push(p);
            getWorld().playerProjectiles.push(p);
        }
        
        this.collider = $.makeCircleCollider(x+this.col_xoff, y+this.col_yoff, 50);
        this.collider.bounciness = 0.0;
        this.collider.friction   = 0.0;
        this.collider.mass       = 1;
        getWorld().playerCircles.push(this.collider);

    }


    draw()
    {
        $.shape.oval(...this.pos, 20, 20);
        this.objects.draw(...this.pos);
    }


    shoot()
    {
        const origin = this.arm_R.endPosition();
        const dir    = this.arm_R.endDirection();

        {
            const idx = Math.round($.math.random(0, this.pewsounds.length-1));
            this.pewsounds[idx].play();
        }

        {
            this.projectile_idx = (this.projectile_idx + 1) % this.MAX_PROJECTILES;

            let p = this.projectiles[this.projectile_idx];

            p.position.x = origin[0];
            p.position.y = origin[1];
            p.velocity.x = this.PROJECTILE_SPEED * dir[0];
            p.velocity.y = this.PROJECTILE_SPEED * dir[1];
        }
    }


    // _update_grounded()
    // {
    //     let world = getWorld();
    //     let collides = false;

    //     for (let box of world.environmentBoxes)
    //     {
    //         if (this.collider.collides(box))
    //         {
    //             collides = true;
    //             this.grounded_y = this.collider.position.y;
    //             break;
    //         }
    //     }

    //     if (collides)
    //     {
    //         this.airtime = 0.0;
    //     }

    //     else
    //     {
    //         this.airtime += (1.0 / $.fps);
    //     }

    //     this.grounded = (this.airtime < 2.0);
    // }


    update()
    {
        const px = this.collider.position.x;
        const py = this.collider.position.y;

        const GROUND_Y = -100;

        if (py > GROUND_Y)
        {
            this.collider.position.y = GROUND_Y;
            this.collider.velocity.y = 0;
        }


        for (let p of this.projectiles)
        {
            const x = p.position.x;
            const y = p.position.y;
        
            drawimg(this.torso.img, x, y, 0.025);
        }

        // if (this.grounded)
        // {
        //     this.pos[0] = px;
        //     this.pos[1] = this.grounded_y + this.col_yoff;
        //     console.log("GROUNDED", this.airtime);
        // }

        // else
        {
            // console.log("NOT GROUNDED", this.airtime);

            this.pos[0] = px + this.col_xoff;
            this.pos[1] = py + this.col_yoff;
        }


        {
            const dx = this.collider.position.x - this.collider.positionPrevious.x;
            const dy = this.collider.position.x - this.collider.positionPrevious.y;
            this.objects.move(dx, dy);
        }

        this.objects.update();

        let delta = [0.0, 0.0];

        const directions = [ [-1, 0], [+1, 0], [0, -1], [0, +1] ];
        const keys       = ["A", "D", "W", "S", "space"];


        let curr_left = $.mouse.leftDown;

        if (curr_left == true && this.prev_left_down == false)
        {
            this.shoot();
        }

        this.prev_left_down = curr_left;


        for (let i=0; i<4; i++)
        {
            if ($.keys.down(keys[i]))
            {
                delta = vec2_add(delta, directions[i]);
            }
        }

        delta[1] += 0.2;

        this.collider.velocity.x += delta[0];
        this.collider.velocity.y += delta[1];


    }

}
