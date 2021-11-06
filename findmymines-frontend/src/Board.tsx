export enum CellType {
    UNOPEN,
    OPEN,
    BOMB,
    GOLDEN_BOMB,
}

interface BoardCellProps {
    cell: CellType,
    onClick: () => void
}

function BoardCell(props: BoardCellProps) {
    switch (props.cell) {
        case CellType.UNOPEN:
            return <div className="board-cell cell-unopen" onClick={props.onClick} />
        case CellType.OPEN:
            return <div className="board-cell cell-open" onClick={props.onClick} />
        case CellType.BOMB:
            return <div className="board-cell cell-bomb" onClick={props.onClick} />
        case CellType.GOLDEN_BOMB:
            return <div className="board-cell cell-golden-bomb" onClick={props.onClick} />
    }
}

interface BoardRowProps {
    row: CellType[],
    cellClick: (i: number) => void
}

function BoardRow(props: BoardRowProps) {
    return <div className="board-row">
        {props.row.map((cell, i) =>
            <BoardCell key={i} cell={cell} onClick={() => props.cellClick(i)} />
        )}
    </div>
}

export interface BoardProps {
    table: CellType[][],
    cellClick: (row: number, col: number) => void
}

export function Board(props: BoardProps) {
    return (
        <div className="board">
            {props.table.map((row, j) => <BoardRow key={j} row={row} cellClick={
                (i) => props.cellClick(j, i)
            } />)}
        </ div>
    )
}