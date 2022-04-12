import Phaser from "phaser"
import StateMachine from "~/statemachine/StateMachine";
import {sharedInstance as events} from "~/scenes/EventCenter";
import ObstaclesController from "~/scenes/ObstaclesController";

type CursorsKeys= Phaser.Types.Input.Keyboard.CursorKeys

export default class PlayerController {
    private scene: Phaser.Scene
    private sprite: Phaser.Physics.Matter.Sprite
    private stateMachine: StateMachine
    private cursors: CursorsKeys
    private obstacles: ObstaclesController
    private health = 100

    private lastSnowmen?: Phaser.Physics.Matter.Sprite

    constructor(scene: Phaser.Scene,sprite: Phaser.Physics.Matter.Sprite, cursors: CursorsKeys, obstacles: ObstaclesController) {
        this.scene = scene
        this.sprite = sprite
        this.cursors = cursors
        this.obstacles = obstacles
        this.createAnimations()


        this.stateMachine = new StateMachine(this, 'player')

        this.stateMachine.addState('idle', {
            onEnter: this.idleOnEnter,
            onUpdate: this.idleOnUpdate
        })
            .addState('walk', {
                onEnter: this.walkOnEnter,
                onUpdate: this.walkOnUpdate,
                onExit: this.walkOnExit
            })
            .addState('jump', {
                onEnter: this.jumpOnEnter,
                onUpdate: this.jumpOnUpdate
            })
            .addState('spike-hit',{
                onEnter: this.spikeHitOnEnter
        })
            .addState('snowmen-hit',{
                onEnter:this.snowmenHitOnEnter,
            })
            .addState('snowmen-stomp',{
                onEnter:this.snowmenStompOnEnter,
            })
            .setState('idle')

        this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
            const body = data.bodyB as MatterJS.BodyType
            const bodyB = data.bodyA as MatterJS.BodyType
            const gameObject = body.gameObject
            const gameObject2 = bodyB.gameObject
            if (this.obstacles.is('spikes', body))
            {
                this.stateMachine.setState('spike-hit')
                console.log('is spike')
                return
            }
            if(this.obstacles.is('snowmen', body))
            {
                this.lastSnowmen= body.gameObject
                if(this.sprite.y+this.sprite.height/2 < body.position.y)
                {
                    this.stateMachine.setState('snowmen-stomp')
                }
                else
                {
                    this.stateMachine.setState('snowmen-hit')
                }
                return
            }
            if(!gameObject)
            {
                return
            }
            if(gameObject2 instanceof Phaser.Physics.Matter.TileBody)
            {
                if (this.stateMachine.isCurrentState('jump'))
                {
                    this.stateMachine.setState('idle')
                }
                return
            }
            const sprite = gameObject as Phaser.Physics.Matter.Sprite
            const type = sprite.getData('type')
            switch(type)
            {
                case "star":
                {
                    events.emit('star-collected')
                    sprite.destroy()
                    break
                }
                case "health":
                {
                    const value= sprite.getData('healthPoints') ?? 10
                    this.health= Phaser.Math.Clamp(this.health + value, 0 ,100)
                    events.emit('health-changed', this.health)
                    sprite.destroy()
                    break
                }
            }
        })
    }


    update(dt: number) {
        this.stateMachine.update(dt)
    }

    private idleOnEnter() {
        this.sprite.play('player-idle')
    }
    private idleOnUpdate(){
        if (this.cursors.left.isDown || this.cursors.right.isDown){
            this.stateMachine.setState('walk')
        }

        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space)
        if (spaceJustPressed) {
            this.stateMachine.setState('jump')
        }
    }

    private walkOnEnter() {
        this.sprite.play('player-walk')
    }
    private walkOnUpdate() {
        const speed = 5
        if (this.cursors.left.isDown) {
            this.sprite.setVelocityX(-speed)
            this.sprite.flipX = true
        } else if (this.cursors.right.isDown) {
            this.sprite.setVelocityX(speed)
            this.sprite.flipX = false
        } else {
            this.sprite.setVelocityX(0)
            this.stateMachine.setState('idle')
        }
        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space)
        if (spaceJustPressed) {
            this.stateMachine.setState('jump')
        }
    }
    private walkOnExit(){
        this.sprite.stop()
    }
    private jumpOnEnter()
    {
        this.sprite.setVelocityY(-12)
    }
    private jumpOnUpdate()
    {
        const speed = 5

        if (this.cursors.left.isDown) {
            this.sprite.setVelocityX(-speed)
            this.sprite.flipX = true
        } else if (this.cursors.right.isDown) {
            this.sprite.setVelocityX(speed)
            this.sprite.flipX = false
        }
    }
    private spikeHitOnEnter(){
        this.sprite.setVelocityY(-12)
        this.health = Phaser.Math.Clamp(this.health-10,0,100)
        events.emit('health-changed', this.health)
        const startColor = Phaser.Display.Color.ValueToColor(0xffffff)
        const endColor = Phaser.Display.Color.ValueToColor(0xff0000)

        this.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 100,
            repeat: 2,
            ease: Phaser.Math.Easing.Sine.InOut,
            yoyo:true,
            onUpdate: tween => {
               const value = tween.getValue()
               const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                    startColor,
                   endColor,
                   100,
                   value
               )
                const color = Phaser.Display.Color.GetColor(
                    colorObject.r,
                    colorObject.g,
                    colorObject.b
                )
                this.sprite.setTint(color)
            }
        })

        this.stateMachine.setState('idle')
    }
    private snowmenHitOnEnter()
    {
        if(this.lastSnowmen)
        {
            if (this.sprite.x+5 < this.lastSnowmen.x)
            {
                this.sprite.setVelocityX(-20)
            } else
            {
                this.sprite.setVelocityX(20)
            }
        }
        else
        {
            this.sprite.setVelocityY(-20)
        }

            this.health = Phaser.Math.Clamp(this.health-10,0,100)

            events.emit('health-changed', this.health)

            const startColor = Phaser.Display.Color.ValueToColor(0xffffff)
            const endColor = Phaser.Display.Color.ValueToColor(0x0000ff)

            this.scene.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 100,
                repeat: 2,
                ease: Phaser.Math.Easing.Sine.InOut,
                yoyo:true,
                onUpdate: tween => {
                    const value = tween.getValue()
                    const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                        startColor,
                        endColor,
                        100,
                        value
                    )
                    const color = Phaser.Display.Color.GetColor(
                        colorObject.r,
                        colorObject.g,
                        colorObject.b
                    )
                    this.sprite.setTint(color)
                }
            })
        this.stateMachine.setState('idle')
    }
    private snowmenStompOnEnter()
    {
        this.sprite.setVelocityY(-10)
        events.emit('snowmen-stomped',this.lastSnowmen)
        this.stateMachine.setState('idle')
    }
    private createAnimations() {
        this.sprite.anims.create({
            key: "player-idle",
            frameRate: 4,
            frames: [{key: 'player', frame: 'robo_player_0'}],
            repeat: -1,
        })
        this.sprite.anims.create({
            key: 'player-walk',
            frameRate: 4,
            frames: this.sprite.anims.generateFrameNames('player', {start: 2, end: 3, prefix: 'robo_player_'}),
            repeat: -1,
        })

    }
}