import { $, shape, colour, mouse, keys, text } from "../../lib/Pen.js";
import { Collider } from "./Collider.js";
import { CollisionUtilities } from "./CollisionUtilities.js";
import { QuadTree } from "./QuadTree.js";


//errors
import { ErrorMsgManager } from "./ErrorMessageManager.js";

export class CollisionManager {
    #pen;

    //overlaps and collides to be run next management
    #pendingCollision;

    //ids to be use for collides and overlaps
    #pendingCollisionArray;

    #collisionCounter;

    //Holds all the objects that need to be put into the quadtree for collision
    #collisionObjects;
    #collisionObjectsIds;

    #quadTree;

    constructor(pen) {
        this.#pen = pen;
        this.#quadTree = new QuadTree();

        this.#pendingCollision = new Set();
        this.#pendingCollisionArray = new Array(2000);

        this.#collisionObjectsIds = new Set();
        this.#collisionObjects = new Array();

        this.#collisionCounter = 0;
        Object.preventExtensions(this);
    }

    overlaps(collider1, collider2) {
        let id = this.getSetId(collider1, collider2, 0);
        if (!this.#pendingCollision.has(id)) {
            this.addCollisionToArray(collider1, collider2, 0);
            this.#pendingCollision.add(id);
        }
        return collider1.collisions.has(collider2.id);
    }

    collides(collider1, collider2) {
        let id = this.getSetId(collider1, collider2, 1);
        if (!this.#pendingCollision.has(id)) {
            this.addCollisionToArray(collider1, collider2, 1);
            this.#pendingCollision.add(id);
        }
        return collider1.collisions.has(collider2.id);
    }

    collidersOverlap(collider1, collider2) {
        
        let result = CollisionUtilities.sphereTest(
            collider1.x,
            collider1.y,
            collider1.radius,
            collider2.x,
            collider2.y,
            collider2.radius
        );

        if (collider1.shape === "circle" && collider2.shape === "circle") {
            return result;
        }

        if (!result)
            return false;

        if (collider1.shape === "box" && collider2.shape === "circle") {
            return CollisionUtilities.rectangleIntersectsCircle(collider2.x, collider2.y, collider2.radius, 
                                                collider1.vertices[0].x, collider1.vertices[0].y, 
                                                collider1.vertices[1].x, collider1.vertices[1].y,
                                                collider1.vertices[2].x, collider1.vertices[2].y, 
                                                collider1.vertices[3].x, collider1.vertices[3].y);
        } else if (collider1.shape === "circle" && collider2.shape === "box") {
            return CollisionUtilities.rectangleIntersectsCircle(collider1.x, collider1.y, collider1.radius, 
                                                collider2.vertices[0].x, collider2.vertices[0].y, 
                                                collider2.vertices[1].x, collider2.vertices[1].y,
                                                collider2.vertices[2].x, collider2.vertices[2].y, 
                                                collider2.vertices[3].x, collider2.vertices[3].y);
        } else {
            return CollisionUtilities.rectangleIntersectsRectangle(collider1.vertices[0].x, collider1.vertices[0].y, 
                                                collider1.vertices[1].x, collider1.vertices[1].y,
                                                collider1.vertices[2].x, collider1.vertices[2].y, 
                                                collider1.vertices[3].x, collider1.vertices[3].y, 
                                                collider2.vertices[0].x, collider2.vertices[0].y, 
                                                collider2.vertices[1].x, collider2.vertices[1].y,
                                                collider2.vertices[2].x, collider2.vertices[2].y, 
                                                collider2.vertices[3].x, collider2.vertices[3].y);
        }
    }

    addCollisionToArray(collider1, collider2, isOverlap) {
        this.#pendingCollisionArray[this.#collisionCounter] = collider1;
        this.#collisionCounter += 1;
        this.#pendingCollisionArray[this.#collisionCounter] = collider2;
        this.#collisionCounter += 1;
        this.#pendingCollisionArray[this.#collisionCounter] = isOverlap;
        this.#collisionCounter += 1;
    }

    addCollisionToQuadObjects(collider) {
        if (!this.#collisionObjectsIds.has(collider.id)) {
            this.#collisionObjectsIds.add(collider.id);
            this.#collisionObjects.push(collider);
        }
    }

    getSetId(collider1, collider2, collide) {
        let id = "";
        if (collide == 1) {
            id += ":";
        }

        if (collider1.id < collider2.id) {
            return id + collider1.id + ":" + collider2.id;
        } else {
            return id + collider2.id + ":" + collider1.id;
        }
    }

    collidesOrOverlapsColliderToCollider(collider1, collider2, overlaps) {
        let validIds1 = collider1.validOverlapsIds;
        let validIds2 = collider2.validOverlapsIds;
        let collisions1 = collider1.overlays;
        let collisions2 = collider2.overlays;
        if (!overlaps) {
            validIds1 = collider1.validCollisionIds;
            validIds2 = collider2.validCollisionIds;
            collisions1 = collider1.collisions;
            collisions2 = collider2.collisions;
        }
        this.addCollisionToQuadObjects(collider1);
        this.addCollisionToQuadObjects(collider2);

        let result = false;

        validIds1.add(collider2.id);
        if (collisions1.has(collider2.id)) {
            result = true;
        }

        validIds2.add(collider1.id);
        if (!result) {
            if (collisions2.has(collider1.id)) {
                result = true;
            }
        }

        return result;
    }

    collidesOrOverlapsGroupToCollider(entities, collider, group1Id, overlaps) {
        let result = false;
        for (let i = 0; i < entities.length; i++) {
            const sprite = entities[i];
            if (overlaps) {
                sprite.validOverlapsIds.add(collider.id);
            } else {
                sprite.validCollisionIds.add(collider.id);
            }
            this.addCollisionToQuadObjects(sprite);
        }
        if (overlaps) {
            collider.validOverlapsIds.add(group1Id);
        } else {
            collider.validCollisionIds.add(group1Id);
        }
        this.addCollisionToQuadObjects(collider);
        if (overlaps) {
            if (collider.overlays.has(group1Id)) {
                result = true;
            }
        } else {
            if (collider.collisions.has(group1Id)) {
                result = true;
            }
        }

        return result;
    }

    collidesOrOverlapsGroupToGroup(entities1, entities2, group1Id, group2Id, overlaps) {
        
        let result = false;

        for (let i = 0; i < entities1.length; i++) {
            const sprite = entities1[i];
            if (overlaps) {
                sprite.validOverlapsIds.add(group2Id);
            } else {
                sprite.validCollisionIds.add(group2Id);
            }
            this.addCollisionToQuadObjects(sprite);

            if(!result){
                if (overlaps) {
                    if (sprite.overlays.has(group2Id)) {
                        result = true;
                    }
                } else {
                    if (sprite.collisions.has(group2Id)) {
                        result = true;
                    }
                }
            }
        }
        for (let i = 0; i < entities2.length; i++) {
            const sprite = entities2[i];
            if (overlaps) {
                sprite.validOverlapsIds.add(group1Id);
            } else {
                sprite.validCollisionIds.add(group1Id);
            }
            this.addCollisionToQuadObjects(sprite);
            if(!result){
            if (overlaps) {
                if (sprite.overlays.has(group1Id)) {
                    result = true;
                }
            } else {
                if (sprite.collisions.has(group1Id)) {
                    result = true;
                }
            }
            }
        }
        return result;
    }

    collidesOrOverlapsGroupSelfToSelf(entities, groupId, overlaps) {
        let result = false;
        for (let i = 0; i < entities.length; i++) {
            const sprite = entities[i];
            if (overlaps) {
                sprite.validOverlapsIds.add(groupId);
            } else {
                sprite.validCollisionIds.add(groupId);
            }
            this.addCollisionToQuadObjects(sprite);
            if(!result){
                if (overlaps) {
                    if (sprite.overlays.has(groupId)) {
                        result = true;
                    }
                } else {
                    if (sprite.collisions.has(groupId)) {
                        result = true;
                    }
                }
            }
        }
        return result;
    }

    processTree(quad) {
        if (quad.objects != null) {
            for (let i = 0; i < quad.objects.length; i++) {
                const sprite = quad.objects[i];
                for (let j = i + 1; j < quad.objects.length; j++) {
                    const sprite2 = quad.objects[j];
                    let canCollide = false;
                    if (sprite.validCollisionIds.has(sprite2.id)) {
                        canCollide = true;
                    }
                    for (
                        let k = 0;
                        k < sprite2.groupsOwnedBy.length && !canCollide;
                        k++
                    ) {
                        if (
                            sprite.validCollisionIds.has(
                                sprite2.groupsOwnedBy[k]
                            )
                        ) {
                            canCollide = true;
                        }
                    }
                    if (canCollide) {
                        this.collides(sprite, sprite2);
                    }

                    ///this is so that if something has collided, we don't need to check if it overlapped as well.
                    let canOverlap = canCollide;
                    if (sprite.validOverlapsIds.has(sprite2.id)) {
                        canOverlap = true;
                    }
                    for (
                        let k = 0;
                        k < sprite2.groupsOwnedBy.length && !canOverlap;
                        k++
                    ) {
                        if (
                            sprite.validOverlapsIds.has(
                                sprite2.groupsOwnedBy[k]
                            )
                        ) {
                            canOverlap = true;
                        }
                    }
                    if (canOverlap) {
                        this.overlaps(sprite, sprite2);
                    }
                }
            }
        } else {
            for (let i = 1; i <= 4; i++) {
                const q = quad.getQuad(i);
                if (q != null) {
                    this.processTree(q);
                }
            }
        }
    }

    doCollide2(collider1, collider2) {
        let dist = CollisionUtilities.distanceBetweenpoints(
            collider1,
            collider2
        );
        let minimumDist = collider1.radius + collider2.radius + 0.5;
        let difference = minimumDist - dist;

        let v1 = {
            x: collider1._trueX - collider1.positionPrevious.x,
            y: collider1._trueY - collider1.positionPrevious.y,
        };
        let v2 = {
            x: collider2._trueX - collider2.positionPrevious.x,
            y: collider2._trueY - collider2.positionPrevious.y,
        };

        let vectorV = { x: v1.x - v2.x, y: v1.y - v2.y };
        let vectorN = CollisionUtilities.normalize(collider1.x - collider2.x, collider1.y - collider2.y);
        let vectorSeparate = CollisionUtilities.dotProduct(vectorV, vectorN);
        let new_sepVel = -vectorSeparate * (collider1.bounciness * collider2.bounciness);

        //the difference between the new and the original sep.velocity value
        let vsep_diff = new_sepVel - vectorSeparate;

        if (collider1.static == false && collider2.static == false) {
            let m1 = 1 / collider1.mass;
            let m2 = 1 / collider2.mass;

            //dividing the impulse value in the ration of the inverse masses
            //and adding the impulse vector to the original vel. vectors
            //according to their inverse mass
            let impulse = vsep_diff / (m1 + m2);
            let impulseVec = { x: vectorN.x * impulse, y: vectorN.y * impulse };

            //get the angle between the vector of c1 and the vector from c1 to c2
            let angle1 = 0;
            let angle2 = 0;
            angle1 = CollisionUtilities.angleBetweenVectors(CollisionUtilities.normalize(v1.x, v1.y), CollisionUtilities.normalize(-vectorBetween.x, -vectorBetween.y));
            if (!Number.isFinite(angle1) || angle1 > 90 || angle1 < -90) {
                angle1 = 0;
            }
    
            angle2 = CollisionUtilities.angleBetweenVectors(CollisionUtilities.normalize(v2.x, v2.y), CollisionUtilities.normalize(vectorBetween.x, vectorBetween.y));
            if (!Number.isFinite(angle2) || angle2 > 90 || angle2 < -90) {
                angle2 = 0;
            }
            

            let extraSpinFraction1 = Math.abs(angle1) / 90;
            let extraSpinFraction2 = Math.abs(angle2) / 90;

            collider1.velocity.modify(impulseVec.x * m1 , impulseVec.y * m1 );
            collider2.velocity.modify(-impulseVec.x * m2 , -impulseVec.y * m2 );
            
            let diff = CollisionUtilities.difference(collider1.rotationalVelocity, -collider2.rotationalVelocity) / 100;

            let rot1 = collider1.rotationalVelocity;
            if (collider1.rotationalVelocity > collider2.rotationalVelocity) {
                rot1 += diff;
            } else {
                rot1 -= diff;
            }
            rot1 += extraSpinFraction2;

            let rot2 = collider2.rotationalVelocity;
            if (collider2.rotationalVelocity > collider1.rotationalVelocity) {
                rot2 += diff;
            } else {
                rot2 -= diff;
            }  
            rot2 += extraSpinFraction1;

            collider1.rotationalVelocity = rot1;
            collider2.rotationalVelocity = rot2;

            //normalise the masses so we can use them as multiplier in the position fix
            let n = 1 / (m1 + m2);
            m1 = m1 * n;
            m2 = m2 * n;

            //move objects apart to prevent collision over multiple frames
            if (dist < minimumDist) {
                collider1.x += vectorN.x * difference * m1;
                collider1.y += vectorN.y * difference * m1;
                collider2.x -= vectorN.x * difference * m2;
                collider2.y -= vectorN.y * difference * m2;
            }
        } else {
            let staticCollider;
            let otherCollider;
            if (collider1.static == true) {
                staticCollider = collider1;
                otherCollider = collider2;
            } else {
                staticCollider = collider2;
                otherCollider = collider1;
            }

            otherCollider.velocity.modify(-vectorN.x, -vectorN.y);
            //otherCollider.rotationalVelocity = otherCollider.rotationalVelocity / 2; //remove half the rotational velocity because it is 'absorbed'

            //move objects apart to prevent collision over multiple frames
            if (dist < minimumDist) {
                otherCollider.x -= vectorN.x * difference;
                otherCollider.y -= vectorN.y * difference;
            }
        }
    }

    static getAxisForBox(boxCollider, edge) {
        let axis = {hasAxis: false, length: 0, height: 0, m: 0, c: 0, vector:{x:0, y:0}, normal:{x:0, y:0}, edge: edge}

        if (boxCollider.w == boxCollider.h) {
            return axis; //box is a square, it has no internal axis
        } else {
            axis.hasAxis = true;
            if (edge == 1 || edge == 3) {
                axis.m = (boxCollider.vertices[1].y - boxCollider.vertices[0].y) / (boxCollider.vertices[1].x - boxCollider.vertices[0].x); //dy/dx
                axis.length = boxCollider.w;
                axis.height = boxCollider.h;
            } else if (edge == 2 || edge == 4) {
                axis.m = (boxCollider.vertices[2].y - boxCollider.vertices[0].y) / (boxCollider.vertices[2].x - boxCollider.vertices[0].x); //dy/dx
                axis.length = boxCollider.h;   
                axis.height = boxCollider.w;  
            } else {
                if (boxCollider.w > boxCollider.h) {
                    axis.m = (boxCollider.vertices[1].y - boxCollider.vertices[0].y) / (boxCollider.vertices[1].x - boxCollider.vertices[0].x); //dy/dx
                    axis.length = boxCollider.w;
                    axis.height = boxCollider.h;
                } else {
                    axis.m = (boxCollider.vertices[2].y - boxCollider.vertices[0].y) / (boxCollider.vertices[2].x - boxCollider.vertices[0].x); //dy/dx
                    axis.length = boxCollider.h;
                    axis.height = boxCollider.w;
                }
            }
            axis.c = boxCollider.y - (axis.m * boxCollider.x); //c = y - mx

            //work out the vector for that axis
            if (Number.isFinite(axis.m)) {
                const x = (boxCollider.x + 100);
                const y = (axis.m * x) + axis.c;
                axis.vector = CollisionUtilities.normalize(x-boxCollider.x, y-boxCollider.y);
            } else {
                axis.vector = {x:0, y:1};
            }
            axis.normal = CollisionUtilities.getNormal(axis.vector.x, axis.vector.y);

            $.colour.stroke = "black";
            //$.shape.line(boxCollider.x - (axis.vector.x * axis.length/2), boxCollider.y - (axis.vector.y * axis.length/2), boxCollider.x + (axis.vector.x * axis.length/2), boxCollider.y + (axis.vector.y * axis.length/2));
            //$.shape.line(boxCollider.x + (axis.normal.x * axis.height/2), boxCollider.y + (axis.normal.y * axis.height/2), boxCollider.x - (axis.normal.x * axis.height/2), boxCollider.y - (axis.normal.y * axis.height/2));

            return axis;
        }
    }

    doCollide(collider1, collider2) {
        //get intersection point
        let axis1 = {x: 0, y: 0};
        let axis2 = {x: 0, y: 0};
        let intersect = {x: 0, y: 0};
        let box1Axis = null;
        let box2Axis = null;
        const vectorBetween = { x: collider2.x - collider1.x, y: collider2.y - collider1.y };
        if (collider1.shape == "circle" && collider2.shape == "circle") {
            //mid point of vector between circle's middle points
            axis1 = { x: collider1.x, y: collider1.y};
            axis2 = { x: collider2.x, y: collider2.y};
            intersect = { x: collider1.x + (vectorBetween.x/2), y: collider1.y + (vectorBetween.y/2)};

        } else if ((collider1.shape == "box" && collider2.shape == "circle") || (collider1.shape == "circle" && collider2.shape == "box")) {
            //label the differet colliders to handle both situations
            let circleCollider = collider1;
            let boxCollider = collider2;
            if (collider1.shape == "box" && collider2.shape == "circle") {
                circleCollider = collider2;
                boxCollider = collider1;
            }
            //calculate the centre axis of the box collider
            if (boxCollider.w == boxCollider.h) {
                //this is a square, we can just use circle intersect instead
                axis1 = { x: collider1.x, y: collider1.y};
                axis2 = { x: collider2.x, y: collider2.y};
                intersect = { x: collider1.x + (vectorBetween.x/2), y: collider1.y + (vectorBetween.y/2)};
                box1Axis = CollisionManager.getAxisForBox(boxCollider, 0);
                box2Axis = box1Axis;
            } else {
                const boxAxis = CollisionManager.getAxisForBox(boxCollider, 0);
                
                intersect = CollisionUtilities.lineIntersectsLine(boxCollider.x, boxCollider.y, boxCollider.x + boxAxis.vector.x, boxCollider.y + boxAxis.vector.y,
                circleCollider.x, circleCollider.y, circleCollider.x + boxAxis.normal.x, circleCollider.y + boxAxis.normal.y);

                let intersectVector = {x: intersect.x - boxCollider.x, y: intersect.y - boxCollider.y};
                //clip intersect to end of box
                let dist = CollisionUtilities.distance(intersectVector.x, intersectVector.y);
                let radius = (boxAxis.length/2) - (boxAxis.height/2);
                if (dist > radius) {
                    let limitedVector = CollisionUtilities.normalize(intersectVector.x, intersectVector.y);
                    let percentage = (radius / dist) * dist;
                    limitedVector.x = boxCollider.x + (limitedVector.x * percentage);
                    limitedVector.y = boxCollider.y + (limitedVector.y * percentage);
                    intersect = limitedVector;
                }

                if (!Number.isFinite(intersect.x) || !Number.isFinite(intersect.y) ){
                    intersect = {x: boxCollider.x+1, y:boxCollider.y};
                }

                box1Axis = boxAxis;
                box2Axis = boxAxis;
                axis1 = { x: circleCollider.x, y: circleCollider.y};
                axis2 = intersect;
                if (collider1.shape == "box" && collider2.shape == "circle") {
                    axis1 = intersect;
                    axis2 = { x: circleCollider.x, y: circleCollider.y};
                }

                let normal = CollisionUtilities.normalize(intersect.x - circleCollider.x, intersect.y - circleCollider.y);
                intersect = { x: intersect.x - (normal.x * boxAxis.height/2), y: intersect.y - (normal.y * boxAxis.height/2)};
            }
            
        } else if (collider1.shape == "box" && collider2.shape == "box") {

            //intersection is the average point of all line intersects.
            intersect = CollisionUtilities.intersectBetweenRectangles(collider1.vertices[0].x, collider1.vertices[0].y, 
                collider1.vertices[1].x, collider1.vertices[1].y,
                collider1.vertices[2].x, collider1.vertices[2].y, 
                collider1.vertices[3].x, collider1.vertices[3].y, 
                collider2.vertices[0].x, collider2.vertices[0].y, 
                collider2.vertices[1].x, collider2.vertices[1].y,
                collider2.vertices[2].x, collider2.vertices[2].y, 
                collider2.vertices[3].x, collider2.vertices[3].y);

            const edge1 = CollisionUtilities.getEdgeLineGoesThrough(collider1.x, collider1.y, collider2.x, collider2.y,  
                collider1.vertices[0].x, collider1.vertices[0].y, 
                collider1.vertices[1].x, collider1.vertices[1].y,
                collider1.vertices[2].x, collider1.vertices[2].y, 
                collider1.vertices[3].x, collider1.vertices[3].y);

            box1Axis = CollisionManager.getAxisForBox(collider1, edge1);
            const axis1Intersect = CollisionUtilities.lineIntersectsCircle(intersect.x, intersect.y, collider1.radius, 
                collider1.x - (box1Axis.vector.x * box1Axis.length), collider1.y - (box1Axis.vector.y * box1Axis.length),
                collider1.x + (box1Axis.vector.x * box1Axis.length), collider1.y + (box1Axis.vector.y * box1Axis.length));

            if (axis1Intersect != null) {
                axis1 = { x: axis1Intersect.x, y: axis1Intersect.y};
            } else {
                axis1 = { x: collider1.x, y: collider1.y};
            }

            const edge2 = CollisionUtilities.getEdgeLineGoesThrough(collider2.x, collider2.y, collider1.x, collider1.y,  
                collider2.vertices[0].x, collider2.vertices[0].y, 
                collider2.vertices[1].x, collider2.vertices[1].y,
                collider2.vertices[2].x, collider2.vertices[2].y, 
                collider2.vertices[3].x, collider2.vertices[3].y);

            box2Axis = CollisionManager.getAxisForBox(collider2, edge2);
            const axis2Intersect = CollisionUtilities.lineIntersectsCircle(intersect.x, intersect.y, collider2.radius, 
                collider2.x - (box2Axis.vector.x * box2Axis.length), collider2.y - (box2Axis.vector.y * box2Axis.length),
                collider2.x + (box2Axis.vector.x * box2Axis.length), collider2.y + (box2Axis.vector.y * box2Axis.length));

            if (axis2Intersect != null) {
                axis2 = { x: axis2Intersect.x, y: axis2Intersect.y};
            } else {
                axis2 = { x: collider2.x, y: collider2.y};
            }

        }

        //$.shape.oval(axis1.x, axis1.y, 3);
        //$.shape.oval(axis2.x, axis2.y, 3);
        //$.shape.oval(intersect.x, intersect.y, 3);

        let mass1 = collider1.mass;
        if (collider1.static) {
            mass1 = 10000;
        }

        let mass2 = collider2.mass;
        if (collider2.static) {
            mass2 = 10000;
        }

        let inverseMass1 = (2 * mass2) / (mass1 + mass2);
        let inverseMass2 = (2 * mass1) / (mass2 + mass1);    

        let v1 = {x: collider1.velocity.x, y: collider1.velocity.y};
        let v2 = {x: collider2.velocity.x, y: collider2.velocity.y};

        if (collider1.static == false) {
            let vectorV = {x: v1.x - v2.x, y: v1.y - v2.y};
            let vectorBetween = {x: axis1.x - axis2.x, y: axis1.y - axis2.y};
            if (collider1.shape == "box" && collider2.shape == "box") {
                vectorBetween = {x: box2Axis.normal.x, y: box2Axis.normal.y};
            }
            if (v1.x - v2.x < 0.0001)  {
                vectorBetween.x = 0;
            }
            if (v1.y - v2.y < 0.0001)  {
                vectorBetween.y = 0;
            }
            if (vectorBetween.x == 0 && vectorBetween.y == 0) {
                vectorBetween = {x: 0, y: 0.0001};
            }

            let mult = inverseMass1 * ((CollisionUtilities.dotProduct(vectorV, vectorBetween)) / CollisionUtilities.dotProduct(vectorBetween, vectorBetween));
            if (!isFinite(mult) ) {
                console.log(inverseMass1, vectorV);
            }
            collider1.velocity.x -= vectorBetween.x * mult;
            collider1.velocity.y -= vectorBetween.y * mult;

            let bounce = collider1.bounciness;
            collider1.velocity.x = collider1.velocity.x * bounce;
            collider1.velocity.y = collider1.velocity.y * bounce;
            
        }
        if (collider2.static == false) {
            let vectorV = {x: v2.x - v1.x, y: v2.y - v1.y};
            let vectorBetween = {x: axis2.x - axis1.x, y: axis2.y - axis1.y};
            if (collider1.shape == "box" && collider2.shape == "box") {
                vectorBetween = {x: box1Axis.normal.x, y: box1Axis.normal.y};
            }
            if (v1.x - v2.x < 0.0001)  {
                vectorBetween.x = 0;
            }
            if (v1.y - v2.y < 0.0001)  {
                vectorBetween.y = 0;
            }
            if (vectorBetween.x == 0 && vectorBetween.y == 0) {
                vectorBetween = {x: 0, y: 1};
            }
            let mult = inverseMass2 * ((CollisionUtilities.dotProduct(vectorV, vectorBetween)) / CollisionUtilities.dotProduct(vectorBetween, vectorBetween));
            collider2.velocity.x -= vectorBetween.x * mult;
            collider2.velocity.y -= vectorBetween.y * mult;

            let bounce = collider2.bounciness;
            collider2.velocity.x = collider2.velocity.x * bounce;
            collider2.velocity.y = collider2.velocity.y * bounce;
        }
        //move objects apart to prevent collision over multiple frames
        const buffer = 0.1;
        let difference = 0;
        let vectorN = {x: 0, y: 0}
        if (collider1.shape == "circle" && collider2.shape == "circle") {
            vectorN = CollisionUtilities.normalize(axis1.x - axis2.x, axis1.y - axis2.y);
            const dist = CollisionUtilities.distanceBetweenpoints(axis1, axis2);
            difference = collider1.radius + collider2.radius + buffer - dist;
        } else if (collider1.shape == "box" && collider2.shape == "circle") {
            vectorN = CollisionUtilities.normalize(axis2.x - axis1.x, axis2.y - axis1.y);
            const dist = CollisionUtilities.distanceBetweenpoints(axis1, axis2);
            difference = (box1Axis.height/2) + collider2.radius + buffer - dist;
            if (difference < 0) {
                difference = -difference;
            }
        } else if (collider1.shape == "circle" && collider2.shape == "box") {
            vectorN = CollisionUtilities.normalize(axis1.x - axis2.x, axis1.y - axis2.y);
            const dist = CollisionUtilities.distanceBetweenpoints(axis1, axis2);
            difference = (box2Axis.height/2) + collider1.radius + buffer - dist;
            if (difference < 0) {
                difference = -difference;
            }
        } else if (collider1.shape == "box" && collider2.shape == "box") {
            let edgePoint1 = CollisionUtilities.getEdgePointLineGoesThrough(axis1.x, axis1.y, intersect.x, intersect.y,  
                                collider1.vertices[0].x, collider1.vertices[0].y, 
                                collider1.vertices[1].x, collider1.vertices[1].y,
                                collider1.vertices[2].x, collider1.vertices[2].y, 
                                collider1.vertices[3].x, collider1.vertices[3].y);
            if (edgePoint1 == null) {
                edgePoint1 = intersect;
            }
            const dist1 = CollisionUtilities.distance(edgePoint1.x - intersect.x, edgePoint1.y - intersect.y);

            let edgePoint2 = CollisionUtilities.getEdgePointLineGoesThrough(axis2.x, axis2.y, intersect.x, intersect.y,  
                collider2.vertices[0].x, collider2.vertices[0].y, 
                collider2.vertices[1].x, collider2.vertices[1].y,
                collider2.vertices[2].x, collider2.vertices[2].y, 
                collider2.vertices[3].x, collider2.vertices[3].y);
            if (edgePoint2 == null) {
                edgePoint2 = intersect;
            }
            const dist2 = CollisionUtilities.distance(edgePoint2.x - intersect.x, edgePoint2.y - intersect.y);

            //$.shape.oval(edgePoint1.x, edgePoint1.y, 3);
            //$.shape.oval(edgePoint2.x, edgePoint2.y, 3);
            //$.shape.oval(intersect.x, intersect.y, 3);

            difference = ((dist1 + dist2)/2)  + buffer;
            vectorN = CollisionUtilities.normalize(axis1.x - axis2.x, axis1.y - axis2.y);
        }
        
        let collides = true;
        let counter = 0;
        const stopAfter = 5;
        while(collides && counter < stopAfter) {
            //console.log("test");
            if (collider1.static == false) {
                if (collider1.shape == "box" && collider2.shape == "box") {
                    vectorN = {x: box2Axis.normal.x, y: box2Axis.normal.y};
                }
                collider1.x += vectorN.x * difference * inverseMass1;
                collider1.y += vectorN.y * difference * inverseMass1;
            }
            if (collider2.static == false) {
                if (collider1.shape == "box" && collider2.shape == "box") {
                    vectorN = {x: box1Axis.normal.x, y: box1Axis.normal.y};
                }
                if (collider1.shape == "circle" && collider2.shape == "circle") {
                    collider2.x -= vectorN.x * difference * inverseMass2;
                    collider2.y -= vectorN.y * difference * inverseMass2;
                } else {
                    collider2.x += vectorN.x * difference * inverseMass2;
                    collider2.y += vectorN.y * difference * inverseMass2;
                }
                
            }
            counter += 1;
            collides = this.collidersOverlap(collider1, collider2)
        }
    
        collider1.updateBounds();
        collider2.updateBounds();
        //console.log(difference, collider2.x, collider2.y);
        //console.log(difference, collider1.x, collider2.x);
    }

    handleCollisions() {
        this.#quadTree.makeTree(this.#collisionObjects);
        this.processTree(this.#quadTree.getTree());

        for (let j = 0; j < this.#collisionCounter; j += 3) {
            const c1 = this.#pendingCollisionArray[j];
            const c2 = this.#pendingCollisionArray[j + 1];

            const overlaps = this.collidersOverlap(c1, c2);

            if (overlaps) {
                const type = this.#pendingCollisionArray[j + 2];
                if (type === 1) { //1 MEANS COLLIDE
                    for(let i=0; i<c2.groupsOwnedBy.length; i++){
                        c1.collisions.add(c2.groupsOwnedBy[i]);
                    }
                    for(let i=0; i<c1.groupsOwnedBy.length; i++){
                        c2.collisions.add(c1.groupsOwnedBy[i]);
                    }
                    c1.collisions.add(c2.id);
                    c2.collisions.add(c1.id);
                    this.doCollide(c1, c2);
                } else { //0 means overlay
                    for(let i=0; i<c2.groupsOwnedBy.length; i++){
                        c1.overlays.add(c2.groupsOwnedBy[i]);
                    }
                    for(let i=0; i<c1.groupsOwnedBy.length; i++){
                        c2.overlays.add(c1.groupsOwnedBy[i]);
                    }
                    c1.overlays.add(c2.id);
                    c2.overlays.add(c1.id);
                }
            }
        }

        this.#pendingCollision = new Set();
        this.#collisionCounter = 0;
    }

    finishCollisions() {
        this.#collisionObjects = new Array();
        this.#collisionObjectsIds = new Set();
    }
}
