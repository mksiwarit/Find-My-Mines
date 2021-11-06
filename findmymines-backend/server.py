from itertools import product
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, send, emit
import random as rd
from time import sleep

players = []
scores = [0, 0]
mine_index = []
golden_mine_index = []
open_index = []
current_player = 0
current_time = 10
board_size = 6
num_mine = 11

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")


# Server GUI (UNFINISHED)

@app.route('/')
def index():
    return render_template('index.html', value=players, number=len(players))


@app.route('/reset/', methods=["GET", "POST"])
def reset():
    restartGame()
    sync(broadcast=True)
    return render_template('index.html', value=players, number=len(players))


@app.route('/time/', methods=["GET", "POST"])
def time():
    if request.method == "GET":
        return {"start_time": t.start_time}

    start_time: str = request.form.get("start_time")

    if start_time:
        st = int(start_time)
        t.start_time = st

    return render_template('index.html', value=players)


@app.route('/board/', methods=["GET", "POST"])
def board():
    global board_size
    global num_mine

    if request.method == "GET":
        return {"board_size": board_size, "num_mine": num_mine}

    bs = int(request.form.get("board_size"))
    nm = int(request.form.get("num_mine"))
    if bs*bs < nm:
        return "Deny, Number of mine > Number of board cell", 403

    board_size = int(request.form.get("board_size"))
    num_mine = nm
    restartGame()

    return render_template('index.html', value=players)


@app.route("/timer", methods=["GET", "POST"])
def timer():
    t.decrement()
    return jsonify({"result": current_time})


# Timer logic

class Timer:
    def __init__(self, start_time):
        self.start_time = start_time
        self.generation = 0
        self.reset()

    def decrement(self):
        if self.current_time > 0:
            self.current_time -= 1
        return self.current_time

    def countdown(self, on_count, on_done):
        gen = self.generation
        while self.current_time > 0:
            # This condition purpose is to stop (break) the countdown when reset is called, even in other thread
            # It might seem like this is always False
            # but it can become True if self.generation get mutate (eg. by reset()) while in this loop, which can happen in multithread seeting
            if self.generation != gen:
                break
            on_count(self.current_time)
            self.decrement()
            sleep(1)
            if self.generation != gen:
                break
        else:
            on_done()
        self.counting = False

    def reset(self):
        self.current_time = self.start_time
        # Increment the genereation
        # doing so invalid all older generate, which break them from countdown loop (see countdown method above)
        # Prevent multiple concurret countdown, newer one (higher generation) take piority
        self.generation += 1


t = Timer(start_time=10)


def check_game_ended():
    # Every mine have been open
    return sum(has_bomb for [pos, has_bomb] in open_index) == len(mine_index)


def countdown():
    t.countdown(
        on_count=lambda x: emit("timer", x, broadcast=True),
        on_done=lambda: whoNext() if not check_game_ended() else None
    )


# Get players

@socketio.on('sync')
def sync(broadcast=False):
    socketio.emit('playerUpdate', players, broadcast=True)
    socketio.emit('gameOn', len(mine_index) > 0, broadcast=True)
    socketio.emit('gameEnd', check_game_ended(), broadcast=True)
    socketio.emit('currentPlayer', current_player, broadcast=True)
    socketio.emit('openUpdate', open_index, broadcast=True)
    socketio.emit('scores', scores, broadcast=True)
    socketio.emit('goldenUpdate', golden_mine_index, broadcast=True)
    socketio.emit('timer', t.current_time, broadcast=True)
    socketio.emit('boardSize', board_size, broadcast=True)


# Client connect

@socketio.on('joinRoom')
def on_join(username):
    players.append(username)
    send(username + ' has entered the room.', broadcast=True)
    emit('playerUpdate', players, broadcast=True)

    if len(players) >= 2 and len(mine_index) == 0:
        start_game()


# Client disconnect

@socketio.on('leaveRoom')
def on_leave(username):
    players.pop(username)
    send(username + ' has left the room.', broadcast=True)
    emit('playerUpdate', players, broadcast=True)

    if len(players) >= 2:
        emit('gameOn', False, broadcast=True)


# Game logic for starting game

def start_game():
    send("Starting Game...")
    open_index = list()
    generateMines(num_mine, board_size, board_size)
    emit('gameOn', True, broadcast=True)
    emit('openUpdate', open_index, broadcast=True)
    emit('goldenUpdate', golden_mine_index, broadcast=True)
    send("Game Start")
    whoStarts()
    countdown()


# Game logic for restarting game

def restartGame():
    #[num_mines, grid_width, grid_height] = data
    global scores
    global open_index
    scores = [0, 0]
    socketio.send("Restarting Game...")
    open_index = list()
    #generateMines(num_mines, grid_width, grid_height)
    generateMines(num_mine, board_size, board_size)
    socketio.emit('gameOn', True, broadcast=True)
    socketio.emit('openUpdate', open_index, broadcast=True)
    socketio.emit('goldenUpdate', golden_mine_index, broadcast=True)
    socketio.emit('boardSize', board_size, broadcast=True)
    socketio.send("Game Start")
    whoStarts()


# Game logic for generating mines

@socketio.on('generateMines')
def generateMines(num_mines, grid_width, grid_height):
    global mine_index
    global golden_mine_index
    mine_index = rd.sample(population=list(product(
        range(0, grid_width), range(0, grid_height))), k=num_mines)
    golden_mine_index = [rd.choice(mine_index)]
    socketio.send('Mines have been planted')


# Game logic for checking mines

@socketio.on('checkMines')
def checkMines(pos):
    [x_pos, y_pos] = pos
    print(f"MINE {x_pos} {y_pos}")
    if (x_pos, y_pos) in golden_mine_index:
        scores[current_player] += 500
        emit('checkResults', True)
        emit('goldenResults', True)
        open_index.append(((x_pos, y_pos), 1))
    elif (x_pos, y_pos) in mine_index:
        scores[current_player] += 100
        emit('checkResults', True)
        emit('goldenResults', False)
        open_index.append(((x_pos, y_pos), 1))
    else:
        emit('checkResults', False)
        emit('goldenResults', False)
        open_index.append(((x_pos, y_pos), 0))
    emit('scores', scores, broadcast=True)
    emit('openUpdate', open_index, broadcast=True)
    emit('goldenUpdate', golden_mine_index, broadcast=True)
    emit('gameEnd', check_game_ended(), broadcast=True)
    whoNext()


# Game logic for randoming first player

@socketio.on('whoStarts')
def whoStarts():
    global current_player
    current_player = rd.randrange(0, 1)
    socketio.emit('currentPlayer', current_player, broadcast=True)
    socketio.emit('gameEnd', check_game_ended(), broadcast=True)


# Game logic for choosing next player

@socketio.on('whoNext')
def whoNext():
    global current_player
    current_player = (current_player+1) % 2
    emit('currentPlayer', current_player, broadcast=True)
    t.reset()
    countdown()


# Start server

if __name__ == '__main__':
    socketio.run(app, host='192.168.193.181', port=9993)
