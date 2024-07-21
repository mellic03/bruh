import { $ } from "../lib/Pen.js"
import { drawimg } from "./drawimg.js";

import { vec2_add, vec2_sub, vec2_mult, vec2_midpoint, vec2_normalize, vec2_mag } from "../vec2.js";
import { FABRIK, FABRIK2 } from "./ik.js";
import { clamp, vec2_to_bearing } from "./math.js";



export class BodyPart
{
    dx;
    dy;
    sx;
    sy;
    img;

    constructor( dx, dy, sx, sy, image_path )
    {
        this.dx  = dx;
        this.dy  = dy;
        this.sx  = sx;
        this.sy  = sy;
        this.img = $.loadImageToStamp(-100, -100, image_path);
    }

    update()
    {
        
    }

    draw( x, y )
    {
        drawimg(this.img, x+this.dx, y+this.dy, this.sx, this.sy);
    }
}



export class PlayerLeg
{
    dx;
    dy;

    #xpos   = 0.0;
    #delta  = 0.0;

    #speed      = 2.0;
    #yscale     = 5.0;
    #height     = 0.0;
    #potential  = 0.0;
    #sin_offset = 0.0;

    joints     = [[0, 0], [0, 1], [2, 2]];
    dists      = [80, 100];
    total_dist = 80 + 100;

    fleshimg;


    constructor( dx, dy, left )
    {
        this.dx  = dx;
        this.dy  = dy;
    
        this.fleshimg  = $.loadImageToStamp(-100, -100, "img.jpg");

        if (left == false)
        {
            this.#sin_offset = 90.0;
        }


        this.total_dist = 0.0;

        for (let d of this.dists)
        {
            this.total_dist += d;
        }
    
    };


    update()
    {
        const X = (this.#speed * this.#xpos) + this.#sin_offset;
        const S = this.#potential * ($.math.sin(X) * 0.5 + 0.5);

        this.#height = (this.dy + this.total_dist) - this.#yscale*35*S;

        {
            const dt = (1.0 / $.fps);
            this.#potential *= Math.pow(0.7, dt);
        }
    }


    move( dx, dy )
    {
        this.#delta += dx;
        this.#xpos  += dx;
        this.#potential += Math.abs(dx);
        this.#potential = clamp(this.#potential, 0.0, 1.0);
    }


    draw( x, y )
    {
        const mx = $.mouse.x - ($.camera.x - 500);
        const my = $.mouse.y - ($.camera.y - 500);

        const idx = this.joints.length - 1;
        const dx  = Math.sign(mx - x);

        this.joints[0] = [x + this.dx, y + this.dy];
        this.joints[1][0] = x + 225.0 * dx;
        this.joints[idx] = vec2_add(this.joints[0], [0, this.#height]);

        FABRIK2(this.joints, this.dists, x + dx*50, 1, this.total_dist);

        this.joints.push(vec2_add(this.joints[idx], [dx*35, 0]));
        
        for (let i=0; i<this.joints.length-1; i++)
        {
            const left = this.joints[i];
            const right = this.joints[i+1];

            const AB   = vec2_sub(right, left);
            const dist = vec2_mag(AB);
            const dir  = vec2_normalize(AB);
            const pos  = vec2_add(left, vec2_mult(dir, 0.5*dist));

            const width  = (dist + 10) * (1.0 / this.fleshimg.w);
            const height = 0.05 - (0.01 * i);

            drawimg(this.fleshimg, ...pos, width, height, AB);
        }

        this.joints.pop();

        // $.shape.line(...this.joints[0], ...this.joints[1]);
        // $.shape.line(...this.joints[1], ...this.joints[2]);
    }

}



export class PlayerArm
{
    dx;
    dy;

    joints     = [[0, 0], [0, 1], [2, 2]];
    dists      = [60, 80];
    total_dist = 80 + 100;


    fleshimg;
    weaponimg;

    constructor( dx, dy )
    {
        this.dx  = dx;
        this.dy  = dy;
    
        this.fleshimg  = $.loadImageToStamp(-100, -100, "img.jpg");
        this.weaponimg = $.loadImageToStamp(-100, -100, "gun.png");
        this.total_dist = 0.0;

        for (let d of this.dists)
        {
            this.total_dist += d;
        }
    
    };


    endDirection()
    {
        const idx = this.joints.length - 1;
        const dir = vec2_sub(this.joints[idx], this.joints[idx-1]);
        return vec2_normalize(dir);
    }

    endPosition()
    {
        return this.joints[this.joints.length-1];
    }

    update()
    {

    }

    move( dx, dy )
    {

    }

    draw( x, y )
    {
        const mx = $.mouse.x - ($.camera.x - 500);
        const my = $.mouse.y - ($.camera.y - 500);

        const idx = this.joints.length - 1;
        const dx  = mx - x;
        const sx  = Math.sign(dx);

        this.joints[0] = [x - sx*this.dx, y + this.dy];
        this.joints[1] = vec2_add(this.joints[0], [0, 50]);
        this.joints[idx] = [mx, my];

        const mid  = vec2_midpoint([mx, my], [x, y]);
        const pole = vec2_add(mid, [0.0, 150.0]);

        FABRIK(this.joints, this.dists, 1, this.total_dist);


        const dir = vec2_sub(this.joints[idx], this.joints[idx-1]);
        const pos = vec2_add(this.joints[idx], vec2_mult(dir, 0.4));

        drawimg(this.weaponimg, ...pos, 0.1, sx*0.1, dir);


        for (let i=0; i<this.joints.length-1; i++)
        {
            const left = this.joints[i];
            const right = this.joints[i+1];

            const AB   = vec2_sub(right, left);
            const dist = vec2_mag(AB);
            const dir  = vec2_normalize(AB);
            const pos  = vec2_add(left, vec2_mult(dir, 0.5*dist));

            const width  = (dist + 10) * (1.0 / this.fleshimg.w);
            const height = 0.05 - (0.02 * i);

            drawimg(this.fleshimg, ...pos, width, height, dir);

        }

        // $.shape.line(...this.joints[0], ...this.joints[1]);
        // $.shape.line(...this.joints[1], ...this.joints[2]);
    }
}

