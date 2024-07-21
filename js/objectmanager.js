

export const OBJECT_UPDATEABLE = 1 << 0;
export const OBJECT_DRAWABLE   = 1 << 1;
export const OBJECT_MOVEABLE   = 1 << 2;

export const object_flags = [
    OBJECT_UPDATEABLE,
    OBJECT_DRAWABLE,
    OBJECT_MOVEABLE
];


export class ObjectManager
{
    #objects = []

    constructor()
    {
        for (let i=0; i<object_flags.length; i++)
        {
            this.#objects.push([]);
        }
    }

    addObject( obj, flags )
    {
        for (let i=0; i<object_flags.length; i++)
        {
            if (flags & (object_flags[i]))
            {
                this.#objects[i].push(obj);
            }
        }
    }

    update()
    {
        for (let obj of this.#objects[0])
        {
            obj.update();
        }
    }

    draw( x, y )
    {
        for (let obj of this.#objects[1])
        {
            obj.draw(x, y);
        }
    }

    move( dx, dy )
    {
        for (let obj of this.#objects[2])
        {
            obj.move(dx, dy);
        }
    }

};
