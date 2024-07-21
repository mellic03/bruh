import { $ } from "../lib/Pen.js"
import { getWorld } from "./world.js";
import { drawimg } from "./drawimg.js";

import { FABRIK } from "./ik.js";
import { vec2_add, vec2_mult, vec2_mag, vec2_magSq, vec2_dist, vec2_normalize, vec2_sub, vec2_dir, vec2_dot } from "../vec2.js";
import { vec2_to_bearing } from "./math.js";





export class Tentacle
{
    #joints     = [];
    #distances  = [];
    #joint_dist = 0.0;
    #total_dist = 100.0;
    #width      = 1.0;

    origin     = [450, 450];
    target_pos = [100, 100];
    vel = [1, 1];

    bodyimg;
    headimg;
    hurtsounds;

    segments = $.makeGroup();

    constructor( x, y, width, num_joints, joint_dist, images, sounds )
    {
        this.bodyimg    = images[0];
        this.headimg    = images[1];
        this.hurtsounds = sounds

        this.#joint_dist = joint_dist;
        this.#width = width;

        console.log(x, y, width, num_joints, joint_dist);

        for (let i=0; i<num_joints; i++)
        {
            this.#joints.push([x+joint_dist*i, y+joint_dist*i]);
            this.#distances.push(joint_dist);
            this.segments.push($.makeBoxCollider(0, 0, width, joint_dist));
        }

        this.origin     = [x, y];
        this.target_pos = [x+5, y+5];
        this.#joints[this.#joints.length-1] = [x+10, y+10];



        this.collider = $.makeCircleCollider(x+10, y+10, width);
        this.collider.position.x = this.target_pos[0];
        this.collider.position.y = this.target_pos[1];

        this.#total_dist = 0.0;

        for (let d of this.#distances)
        {
            this.#total_dist += d;
        }
    }


    _update_colliders()
    {
        for (let i=0; i<this.segments.length-1; i++)
        {
            const left  = this.#joints[i];
            const right = this.#joints[i+1];

            const AB   = vec2_sub(right, left);
            const dist = vec2_mag(AB);
            const dir  = vec2_normalize(AB);

            let bearing = vec2_to_bearing(dir);

            this.segments[i].position.x = left[0] + 0.5*dist * dir[0];
            this.segments[i].position.y = left[1] + 0.5*dist * dir[1];
            this.segments[i].rotation = bearing;
        }
    }


    update( dx, dy )
    {
        const dt = (1.0 / $.fps);

        this._update_colliders();

        this.vel[0] += dt*dx;
        this.vel[1] += dt*dy;

        const px = this.collider.position.x;
        const py = this.collider.position.y;
        
        this.#joints[0] = [this.origin[0], this.origin[1]];
        this.#joints[this.#joints.length-1] = [px, py];
    
        FABRIK(this.#joints, this.#distances, 1, this.#total_dist);


        const origin = this.#joints[0];
        const end    = this.#joints[this.#joints.length-1];
        const dir    = vec2_sub(origin, [px, py]);

        if (dir[0] == 0 && dir[1] == 0)
        {
            return;
        }

        const mag = vec2_mag(dir);

        if (mag > this.#total_dist)
        {
            const V  = 10.0;
            this.vel = vec2_mult(vec2_normalize(dir), V);

            // this.collider.position.x = origin[0];
            // this.collider.position.y = origin[1];
        }


        this.collider.velocity.x = this.vel[0];
        this.collider.velocity.y = this.vel[1];
        // this.collider.direction = vec2_to_bearing(this.vel);
        // this.collider.speed     = vec2_mag(this.vel);
    }


    damage()
    {
        const idx = Math.round($.math.random(0, this.hurtsounds.length-1));
        this.hurtsounds[idx].play();
    }


    split( idx )
    {

        console.log("split ", idx);

        const len = this.#joints.length;
        const end = this.#joints[len-1];
        const pos = this.#joints[idx];

        let other = new Tentacle(...pos, this.#width, len-idx, this.#joint_dist, [this.bodyimg, this.headimg], this.hurtsounds);
        other.#joints[other.#joints.length-1] = [end[0], end[1]];

        for (let i=idx; i<len; i++)
        {
            this.segments[i].remove();
        }

        this.#joints.length = idx;
        this.segments.length = idx;

        return other;
    }


    draw()
    {
        for (let i=0; i<this.#joints.length-1; i++)
        {
            const dir = vec2_sub(this.#joints[i+1], this.#joints[i]);
            
            this.bodyimg.rotation = $.math.atan2(dir[1], dir[0]);

            const pos    = vec2_add(this.#joints[i], vec2_mult(dir, 0.5));
            const len    = this.#total_dist / this.#joints.length;
            const width  = (len + 5) * (1.0 / this.bodyimg.w);
            const height = (this.#width - 0.5*i) * (1.0 / this.bodyimg.h);

            drawimg(this.bodyimg, ...pos, width, height, dir);
        }

        for (let i=this.#joints.length-1; i<this.#joints.length; i++)
        {
            const pos   = this.#joints[i];
            const width = ((this.#width - 0.5*(this.#joints.length-1)) * (1.0 / this.headimg.w));

            drawimg(this.headimg, ...pos, width);
            $.text.print(20, 20, String($.fps));
        }
    }

}
