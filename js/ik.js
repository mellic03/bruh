import { vec2_add, vec2_mult, vec2_mag, vec2_normalize, vec2_sub, vec2_point_to_line } from "../vec2.js";


/**
 * 
 * @param {*} joints    = [ [x, y], [x, y], [x, y], ... ]
 * @param {*} distances = [ float,  float,  float,  ... ]
 */
// export function FABRIK( joints, distances )
// {
//     const start = joints[0];
//     const len   = joints.length;

//     // backward pass
//     for (let i=len-2; i>=1; i--)
//     {
//         let left  = joints[i];
//         let right = joints[i+1];
    
//         let dir     = vec2_sub(right, left);
//         let desired = distances[i];
//         let derror  = vec2_mag(dir) - desired;
    
//         dir = vec2_mult(vec2_normalize(dir), derror);
    
//         joints[i] = vec2_add(joints[i], dir);
//     }

//     // forward pass
//     for (let i=1; i<joints.length; i++)
//     {
//         let left  = joints[i-1];
//         let right = joints[i];

//         let dir     = vec2_sub(left, right);
//         let desired = distances[i-1];
//         let derror  = vec2_mag(dir) - desired;
    
//         dir = vec2_mult(vec2_normalize(dir), derror);
    
//         joints[i] = vec2_add(joints[i], dir);
//     }
// }



export function FABRIK( joints, distances, iterations=1, total_dist=-1 )
{
    if (total_dist == -1)
    {
        total_dist = 0.0;

        for (let d of distances)
        {
            total_dist += d;
        }
    }

    let start = joints[0];
    let end   = joints[joints.length-1];
    const len = joints.length;

    {
        const dir = vec2_sub(end, start);
        const len = vec2_mag(dir);

        if (len > (0.99 * total_dist))
        {
            joints[joints.length-1] = vec2_add(start, vec2_mult(vec2_normalize(dir), total_dist));
        }
    }

    for (let iter=0; iter<iterations; iter++)
    {
        // backward pass
        for (let i=len-2; i>=1; i--)
        {
            let left  = joints[i];
            let right = joints[i+1];
        
            let dir     = vec2_sub(right, left);
            let desired = distances[i];
            let derror  = vec2_mag(dir) - desired;
        
            dir = vec2_mult(vec2_normalize(dir), derror);
        
            joints[i] = vec2_add(joints[i], dir);
        }

        // forward pass
        for (let i=1; i<joints.length; i++)
        {
            let left  = joints[i-1];
            let right = joints[i];

            let dir     = vec2_sub(left, right);
            let desired = distances[i-1];
            let derror  = vec2_mag(dir) - desired;
        
            dir = vec2_mult(vec2_normalize(dir), derror);
        
            joints[i] = vec2_add(joints[i], dir);
        }
    }
}



export function FABRIK2( joints, distances, pole_target, iterations=1, total_dist=-1 )
{
    if (total_dist == -1)
    {
        total_dist = 0.0;

        for (let d of distances)
        {
            total_dist += d;
        }
    }

    const start = joints[0];
    const end   = joints[joints.length-1];
    const mid   = vec2_mult(vec2_sub(end, start), 0.5);
    const len   = joints.length;

    {
        const dir = vec2_sub(end, start);
        const len = vec2_mag(dir);

        if (len > (0.99 * total_dist))
        {
            joints[joints.length-1] = vec2_add(start, vec2_mult(vec2_normalize(dir), total_dist));
        }
    }

    for (let i=1; i<joints.length-1; i++)
    {
        
        const dir = vec2_point_to_line(joints[i], start, end);
        joints[i] = vec2_add(joints[i], vec2_mult(dir, 0.15));
    }


    for (let iter=0; iter<iterations; iter++)
    {
        // backward pass
        for (let i=len-2; i>=1; i--)
        {
            let left  = joints[i];
            let right = joints[i+1];
        
            let dir     = vec2_sub(right, left);
            let desired = distances[i];
            let derror  = vec2_mag(dir) - desired;
        
            dir = vec2_mult(vec2_normalize(dir), derror);
        
            joints[i] = vec2_add(joints[i], dir);
        }

        // forward pass
        for (let i=1; i<joints.length; i++)
        {
            let left  = joints[i-1];
            let right = joints[i];

            let dir     = vec2_sub(left, right);
            let desired = distances[i-1];
            let derror  = vec2_mag(dir) - desired;
        
            dir = vec2_mult(vec2_normalize(dir), derror);
        
            joints[i] = vec2_add(joints[i], dir);
        }
    }
}

