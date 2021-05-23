$(document).ready(function () {
    const socket = io();
    let isHost = false;
    let yourTurn = false;

    // get uuid from server
    socket.on('user_joined', data => {
        $('#token').val(data.token);
    })

    // be a host
    socket.on('be_a_host', data => {
        isHost = true;
        yourTurn = false;
    })

    // be a guest
    socket.on('be_a_guest', data => {
        isHost = false;
        yourTurn = true;
    })


    // listen rival hit
    socket.on('receive_hit_board', data => {
        yourTurn = !yourTurn;
        let btnId = data.id;

        $('#' + btnId).prop('disabled', true);

        if(!isHost) {
            $('#' + btnId).css({color: 'blue'});
            $('#' + btnId).html('X');
        } else {
            $('#' + btnId).css({color: 'red'})
            $('#' + btnId).html('O');
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
    $('.caro-btn').on('click', function() {
        if(!yourTurn) {
            return;
        }

        if(isHost) {
            $(this).css({color: 'blue'});
            $(this).html('X');
        } else {
            $(this).css({color: 'red'})
            $(this).html('O');
        }

        yourTurn = !yourTurn;
        $(this).prop('disabled', true);
        socket.emit("hit_board", { id: $(this).attr('id') });
    })

})
