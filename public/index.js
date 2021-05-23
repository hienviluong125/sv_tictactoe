$(document).ready(function () {
    const socket = io();
    let isHost = false;
    let yourTurn = false;
    let canPlay = false;
    let roomToken = "";

    // get uuid from server
    socket.on('user_joined', data => {
        $('#token').val(data.token);
    })

    socket.on('joined_room', data => {
        roomToken = data.roomToken;
        $('.start_game').prop("disabled", false);
        $('#status-label').html("Your joined room succesfully. Press Start game to start");
    })

    // be a host
    socket.on('be_a_host', data => {
        isHost = true;
        yourTurn = false;
        yourTurn ? $('#status-label').html("Your turn") : $('#status-label').html("Rival's turn");
    })

    // be a guest
    socket.on('be_a_guest', data => {
        isHost = false;
        yourTurn = true;
        yourTurn ? $('#status-label').html("Your turn") : $('#status-label').html("Rival's turn");
    })


    // listen rival hit
    socket.on('receive_hit_board', data => {
        yourTurn = !yourTurn;
        let btnId = data.id;

        yourTurn ? $('#status-label').html("Your turn") : $('#status-label').html("Rival's turn");
        $('#' + btnId).prop('disabled', true);

        if (!isHost) {
            $('#' + btnId).css({ color: 'blue' });
            $('#' + btnId).html('X');
        } else {
            $('#' + btnId).css({ color: 'red' })
            $('#' + btnId).html('O');
        }
    })

    socket.on('wait_for_rival', data => {
        $('#status-label').html("Waiting for rival");
    })

    socket.on("tie", data => {
        $('.caro-btn').prop('disabled', true)
        $('.start_game').prop('disabled', true)
        $('.reset_game').prop('disabled', false)
        $('#status-label').html("TIE")
        $('#status-label').css("color", "yellow");
    })

    socket.on("win", data => {
        $('.caro-btn').prop('disabled', true)
        $('.start_game').prop('disabled', true)
        $('.reset_game').prop('disabled', false)
        $('#status-label').html("You WIN")
        $('#status-label').css("color", "green");
        for (let pos of data.positions) {
            $('#' + pos.toString()).css({ background: 'yellow' })
        }
    })

    socket.on("lose", data => {
        $('.caro-btn').prop('disabled', true)
        $('.start_game').prop('disabled', true)
        $('.reset_game').prop('disabled', false)
        $('#status-label').html("Your LOSE")
        $('#status-label').css("color", "red");
        for (let pos of data.positions) {
            $('#' + pos.toString()).css({ background: 'yellow' })
        }
    })

    // join room action
    $('#join-btn').on('click', function () {
        const partnerToken = $('#partner-token').val();

        if (partnerToken) {
            socket.emit("join_by_token", { token: partnerToken });
        }
    })

    // Hit caro action
    $('.caro-btn').on('click', function () {
        if (!yourTurn) {
            return;
        }

        if (isHost) {
            $(this).css({ color: 'blue' });
            $(this).html('X');
        } else {
            $(this).css({ color: 'red' })
            $(this).html('O');
        }

        yourTurn = !yourTurn;
        yourTurn ? $('#status-label').html("Your turn") : $('#status-label').html("Rival's turn");
        $(this).prop('disabled', true);
        socket.emit("hit_board", { id: $(this).attr('id'), isHost: isHost });
    })

    $('.start_game').on('click', function() {
        socket.emit("start_game", { token: $('#token').val(), roomToken: roomToken });
        $(this).prop('disabled', true)
    })

    $('.reset_game').on('click', function() {
        $('.start_game').prop('disabled', true)
        $('.caro-btn').css({'background': 'gray'})
        $('.caro-btn').prop('disabled', false)
        $('.caro-btn').html('')
        $('#status-label').css('color', 'black');
        socket.emit("start_game", { token: $('#token').val(), roomToken: roomToken });
    })

})
