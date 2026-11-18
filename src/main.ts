import './style.css'
import { Game } from './game/Game'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('#app not found')

new Game(root).start()
