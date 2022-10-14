# Bomberman back-end

Application was created for educational purposes

### setPlayer

```json
{
  "method": "setPlayer",
  "args": {
    "name": "playerName"
  }
}
```

### setPlayer to existing server

```json
{
  "method": "setPlayer",
  "args": {
    "name": "player2",
    "roomId": "PUT HERE ROOM ID"
  }
}
```

### startGame

```json
{
  "method": "startGame",
  "args": {
    "roomId": "PUT HERE ROOM ID"
  }
}
```

### setPosition

```json
{
  "method": "setPosition",
  "args": {
    "x": 11,
    "y": 11
  }
}
```

### setBomb

```json
{
  "method": "setBomb"
}
```
