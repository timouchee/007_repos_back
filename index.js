import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import e from "express";


// lancer le serv "node index.js" dans le terminal

let liste_joueur_exemple =
{
    "joueur 1": { "name": "p1", "cooldown_miroire": 0, "recharge": 0, state: "player", "PV": 1, "effect": [] },
    "joueur 2": { "name": "p2", "cooldown_miroire": 0, "recharge": 0, state: "player", "PV": 1, "effect": [] },
    "joueur 3": { "name": "p3", "cooldown_miroire": 0, "recharge": 0, state: "winner", "PV": 1, "effect": [] },
    "joueur 4": { "name": "p4", "cooldown_miroire": 0, "recharge": 0, state: "spectator", "PV": 1, "effect": [] },
    "joueur 5": { "name": "p5", "cooldown_miroire": 0, "recharge": 0, state: "dead", "PV": 1, "effect": [] },
}

let data_teste_1_exemple =
{
    "joueur 1": { "action": "recharge", "priority": 1 },
    "joueur 2": { "action": "pistolet", "target": "joueur 3", "priority": 1 },
    "joueur 3": { "action": "bazooka", "target": "joueur 4", "priority": 1 },
    "joueur 4": { "action": "double_pistolet", "target": ["joueur 3", "joueur 1"], "priority": 1 },
    "joueur 5": { "action": "arrache", "target": "joueur 2", "priority": 2 },
    "joueur 6": { "action": "arrache", "target": "joueur 7", "priority": 2 },
    "joueur 7": { "action": "pisto_lame", "target": ["joueur 1", "joueur 6"], "priority": 1 },
}

let type_action =
{
    1: "utilitaire",
    2: "attaque",
    3: "defense",
    4: "autre",
}

let data_action =
{
    "recharge": { "type": 1, "cout": 0, "priority": 1, "nb_cible": [0] },

    "pistolet": { "type": 2, "cout": 1, "priority": 1, "nb_cible": [1] },
    "double_pistolet": { "type": 2, "cout": 2, "priority": 1, "nb_cible": [1, 2] },
    "double_pistolet_1": { "type": 2, "cout": 1, "priority": 1, "nb_cible": [1], "serveur": true },
    "double_pistolet_2": { "type": 2, "cout": 2, "priority": 1, "nb_cible": [1], "serveur": true },
    "bazooka": { "type": 2, "cout": 3, "priority": 1, "nb_cible": [1] },
    "lame": { "type": 2, "cout": 3, "priority": 1, "nb_cible": [1] },
    "pisto_lame": { "type": 2, "cout": 4, "priority": 1, "nb_cible": [1, 2] },
    "pisto_lame_1": { "type": 2, "cout": 2, "priority": 1, "nb_cible": [1], "serveur": true },
    "pisto_lame_2": { "type": 2, "cout": 4, "priority": 1, "nb_cible": [1], "serveur": true },

    "bouclier": { "type": 3, "cout": 0, "beaten": ["bazooka", "pisto_lame_2"], "priority": 1, "nb_cible": [0] },
    "miroire": { "type": 4, "cout": 0, "beaten": ["lame"], "negate": ["pisto_lame_2", "double_pistolet_2"], "priority": 1, "nb_cible": [0] },

    "arrache": { "type": 4, "cout": 5, "priority": 2, "nb_cible": [1] },

}

let liste_joueur = {}

let info_party =
{
    "id_party": "1AB2C3",
    "max_joueur": 5,
    "min_joueur": 2,
    "etat_party": "waiting", // waiting, started, ended
    "tour_party": 0,
    "nb_joueur": 0,
}

let dico_action_joueur = {};

let lst_action_possible_par_joueur = {}// socket.io : [les action possible pour le joueur]




function getKeysSortedByPriority(data) {
    return Object.keys(data)
        .sort((a, b) => data[b].priority - data[a].priority);
}

function resolution(action) {
    let action_key_sorted = getKeysSortedByPriority(action); // met les priority elever en premier
    console.log(action_key_sorted); // met les priority elever en premier
    let effect = Object.fromEntries(
        Object.keys(action).map(key => [key, []])
    );

    /* for(let truc of action_key_sorted)
    {
        console.log(truc);
    } */
    //console.log(action);
    for (const unJoueur of action_key_sorted)
    //for (const [unJoueur, uneAction] of Object.entries(action)) 
    {
        //let unJoueur = unJoueur;
        let uneAction = action[unJoueur];
        //console.log(data_action[uneAction.action]);  
        //console.log(unJoueur);
        //console.log(uneAction);
        //modifier l'action du double gun en fonction de si viser su la meme chose 
        // meme chose = nouvelle action qui negate miroire et cout 2 cible simple
        // differente = 2 action shoot normal
        // y aura pas de probleme avec le arrache vu qu'il est traiter avant

        if (uneAction.check || !uneAction.action) { continue; }
        //console.log(uneAction); 

        let mesAction = [];
        //console.log("j'ai ",data_action[uneAction.action].nb_cible," cibles");
        // si data_action[uneAction.action].nb_cible possede une de ses valeur au desus de 1
        // exemple : data_action[uneAction.action].nb_cible = [1,2]
        if (Array.isArray(data_action[uneAction.action].nb_cible) && data_action[uneAction.action].nb_cible.some(nb => nb > 1)) {
            //if (data_action[uneAction.action].nb_cible > 1) {
            //faut faire une liste et boucler dessus  
            switch (uneAction.action) {
                case "double_pistolet":
                    //if (uneAction.target[0] != uneAction.target[1]) {
                    if (uneAction.target.length == 2) {
                        mesAction.push({ "action": "double_pistolet_1", "target": uneAction.target[0], "priority": 1 });
                        mesAction.push({ "action": "double_pistolet_1", "target": uneAction.target[1], "priority": 1 });
                    }
                    else {
                        mesAction.push({ "action": "double_pistolet_2", "target": uneAction.target[0], "priority": 1 });
                    }
                    break;
                case "pisto_lame":
                    if (uneAction.target.length == 2) {
                        mesAction.push({ "action": "pisto_lame_1", "target": uneAction.target[0], "priority": 1 });
                        mesAction.push({ "action": "pisto_lame_1", "target": uneAction.target[1], "priority": 1 });
                    }
                    else {
                        mesAction.push({ "action": "pisto_lame_2", "target": uneAction.target[0], "priority": 1 });
                    }
                    break;

                default:
                    break;
            }
        }
        else {
            mesAction.push(uneAction);
        }
        if (uneAction.checkTarget && uneAction.checkTarget.length > 0) {
            mesAction = mesAction.filter(act => !uneAction.checkTarget.includes(act.target));

            // si tout a été supprimé, on marque l'action comme "check"
            if (mesAction.length === 0) {
                uneAction.check = true;
            }
        }
        if (data_action[uneAction.action].type === 3) {
            action[unJoueur].check = true;
        }
        if (uneAction.action === "arrache") {
            if (action[uneAction.target].action === "arrache") {
                effect[uneAction.target].push(["remove", "arrache"]);
                effect[unJoueur].push(["remove", "arrache"]);
                action[unJoueur].check = true;
                action[uneAction.target].check = true;
                //console.log(uneAction.target) ;                 
                action[uneAction.target] = {};
                action[unJoueur] = {};
            }
            else {
                effect[uneAction.target].push(["remove", action[uneAction.target].action]);
                action[unJoueur].check = true;
                //console.log(uneAction.target) ;
                action[uneAction.target] = {};
            }

        }
        if (uneAction.action === "recharge") {
            effect[unJoueur].push(["add", 1]);
            action[unJoueur].check = true;
        }
        if (uneAction.action === "miroire") {
            // faut creer une lsite de joueur et incrmeenter le systeme de cooldown mirroire
            liste_joueur[unJoueur].cooldown_miroire = 1;
            action[unJoueur].check = true;
        }
        if (data_action[uneAction.action].type === 2)//si c'est une attaque que tu fait
        {

            //console.log(unJoueur, " ", mesAction);
            for (let monAttaque of mesAction) {

                if (action[monAttaque.target]?.action == undefined) {
                    console.log("mon attaque target", monAttaque.target);
                    console.log("liste des action des joueur ", dico_action_joueur);
                    console.log("le joueur cibler", action[monAttaque.target]);
                    console.log("liste de mes action", mesAction);
                    console.log("l'action estimer de ma cible", action[monAttaque.target]?.action);
                    console.log("la liste des effet", effect);
                    console.log("les effte de ma cible", effect[monAttaque.target]);
                    effect[monAttaque.target].push(["remove_pv", data_action[monAttaque.action].cout]);//faut faire += pas = 
                    action[unJoueur].check = true;
                    continue;
                }
                if (action[monAttaque.target].action === "bouclier")// si le mec en face fait bouclier
                {
                    if (data_action["bouclier"].beaten.includes(monAttaque.action)) {
                        switch (monAttaque.action) {
                            case "bazooka":
                            case "pisto_lame_2":
                                //arme normal
                                effect[monAttaque.target].push(["remove_pv", data_action[monAttaque.action].cout]);//faut faire += pas = 
                                action[unJoueur].check = true;
                                break;
                            case "pisto_poison":
                                //lui par exemple il est dit anormal
                                break;
                            default:
                                break;
                        }// y a pas de else car si sa beaten pas le bouclier ba i lse passe aps
                    }
                }
                else if (action[monAttaque.target].action === "miroire")//si le mec en face fait miroire
                {
                    if (data_action["miroire"].beaten.includes(monAttaque.action)) {
                        effect[monAttaque.target].push(["remove_pv", data_action[monAttaque.action].cout]);//faut faire += pas = 
                    }
                    else if (!(data_action["miroire"].negate.includes(monAttaque.action))) {
                        effect[unJoueur].push(["remove_pv", data_action[monAttaque.action].cout]);
                    }
                    action[unJoueur].check = true;
                }
                else if (data_action[action[monAttaque.target].action].type === 1)//si le mec en face fait un utilitaire
                {
                    effect[monAttaque.target].push(["remove_pv", data_action[monAttaque.action].cout]);//faut faire += pas = 
                    action[unJoueur].check = true;
                }
                else if (data_action[action[monAttaque.target].action].type === 2)// si le mec en face fait une attaque 
                {

                    let oponant_target = null;
                    let oponant_att_cout = 0;

                    let currentAction = action[monAttaque.target];
                    let actionName = currentAction.action;
                    let target = currentAction.target;

                    // Cas multi-cible de la personne en face
                    if (target.length > 1) {
                        if (target.includes(unJoueur)) {
                            oponant_target = unJoueur;

                            if (actionName === "double_pistolet") {
                                // 1 coût par balle
                                let count = target.filter(t => t === unJoueur).length;
                                oponant_att_cout = 1 * count;
                                if (oponant_att_cout == 2) {
                                    action[monAttaque.target].check = true;
                                }
                                else {
                                    if (!action[monAttaque.target].checkTarget) {
                                        // si checkTarget n'existe pas, on le crée avec unJoueur dedans
                                        action[monAttaque.target].checkTarget = [unJoueur];
                                    } else {
                                        // si checkTarget existe déjà, on ajoute unJoueur
                                        action[monAttaque.target].checkTarget.push(unJoueur);
                                    }
                                }
                            }
                            else if (actionName === "pisto_lame") {
                                // 2 coût par cible
                                let count = target.filter(t => t === unJoueur).length;
                                oponant_att_cout = 2 * count;
                                if (oponant_att_cout == 4) {
                                    action[monAttaque.target].check = true;
                                }
                                else {
                                    if (!action[monAttaque.target].checkTarget) {
                                        // si checkTarget n'existe pas, on le crée avec unJoueur dedans
                                        action[monAttaque.target].checkTarget = [unJoueur];
                                    } else {
                                        // si checkTarget existe déjà, on ajoute unJoueur
                                        action[monAttaque.target].checkTarget.push(unJoueur);
                                    }
                                }
                            }
                        }
                    }
                    // Cas cible unique
                    else {
                        oponant_target = target[0];
                        oponant_att_cout = data_action[action[monAttaque.target].action].cout;
                        console.log("cout de l'attaquant ", oponant_att_cout);
                        console.log("cible de ma cible : ", oponant_target);
                    }

                    if (oponant_target === unJoueur)//il me cible
                    {
                        // tu fait mes cout vs ses cout et tu regarde qui gagne
                        //en fonction tu met les degat a l'un ou l'autre
                        // if() il fait une attaque a fonctionement chelou quand c'est attaque vs attaque pour le moment sa existe pas
                        action[monAttaque.target].check = true;
                        console.log("combat 1v1 entre ", unJoueur, " et ", monAttaque.target);
                        console.log("j'ai fait lattaque ", monAttaque.action, "et lui la sienne ", action[monAttaque.target].action);
                        console.log("je coute ", data_action[monAttaque.action].cout, " et lui coute ", oponant_att_cout);
                        if (data_action[monAttaque.action].cout - oponant_att_cout > 0) {
                            //j'ai gagner le 1v1 faire prendre a oponant la dif
                            effect[monAttaque.target].push(["remove_pv", data_action[monAttaque.action].cout - oponant_att_cout]);//faut faire += pas = 
                            action[unJoueur].check = true;
                        }
                        else if (oponant_att_cout - data_action[monAttaque.action].cout > 0) {
                            // il la gagner le 1v1 je prend la diff
                            effect[unJoueur].push(["remove_pv", oponant_att_cout - data_action[monAttaque.action].cout]);//faut faire += pas = 
                            action[unJoueur].check = true;
                        }
                        else if (oponant_att_cout - data_action[monAttaque.action].cout == 0) {
                            // on est a egaliter donc rien ne se passe
                            action[unJoueur].check = true;
                        }
                    }
                    else // il me cible pas
                    {
                        effect[monAttaque.target].push(["remove_pv", data_action[monAttaque.action].cout]);//faut faire += pas = 
                        action[unJoueur].check = true;
                    }
                }
                else {
                    effect[monAttaque.target].push(["remove_pv", data_action[monAttaque.action].cout]);//faut faire += pas = 
                    action[unJoueur].check = true;
                }
            }

        }


    }

    //console.log(action);
    //console.log(effect);
    return effect;


}







const app = express();
const port = process.env.PORT || 3001; // fallback pour dev local
let timerEnd = null;
let timerInterval = null;
let messages = [];

// HTTP simple (optionnel)
app.get("/", (req, res) => {
    res.send("Serveur 007 actif !");
});

// Crée le serveur HTTP pour Socket.IO
const httpServer = createServer(app);

// Crée le serveur Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173",           // front local Vite
            "https://007-repos-front.vercel.app" // front en ligne (Vercel)
        ],
        methods: ["GET", "POST"]
    },

    /* cors: {
        origin: "*", // autorise tout pour dev, à restreindre en prod
    }, */
});

// Connexion d'un client
io.on("connection", (socket) => {
    console.log("Client connecté :", socket.id);//l'id du joueur 

    // premire connexion + joindre party
    // voire le nombre de joueur connecté pour commencer party
    // party commencer + info party
    // choix possible par personne
    // action de chaque joueur
    // resolution des actions
    // je suis mort
    // fin de la partie

    socket.on("iWantToKnowMyActionPossible", () => {
        console.log("Le joueur", socket.id, "demande ses actions possibles");
        sendListeActionPossibleForOne(socket.id);
    });

    // Quand un joueur envoie un message
    socket.on("send_message", (msg) => {
        const message = {
            author: msg.author || "Anonyme",
            text: msg.text || "",
            time: new Date().toLocaleTimeString(),
        };

        // Ajout dans la liste locale
        messages.push(message);

        // Garde uniquement les 100 derniers messages
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }

        // Diffusion à tout le monde
        io.emit("receive_message", message);
    });

    //un joueur veut rejoindre la party
    socket.on("join_party", (nickName) => {
        console.log("Client a rejoint la partie :", socket.id);
        console.log("nb joueurs dans la partie avant l'ajout:", info_party.nb_joueur);
        liste_joueur[socket.id] = { "name": nickName, "cooldown_miroire": 0, state: "spectator", "recharge": 0, "PV": 1, "effect": [] };//on le rajoute a la liste des joueurs
        info_party.nb_joueur = Object.keys(liste_joueur).length;
        timerEnd = 10;
        socket.emit("party_joined", "1AB2C3");
        socket.emit("load_history", messages);
        io.emit("game_state", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur });
        console.log("Nombre de joueurs dans la partie :", info_party.nb_joueur);
        if (info_party.nb_joueur == 0) {
            console.log("y a eu un probleme car je vien d'ajouter un joueur et le nombre de joueur est a 0");
            info_party.nb_joueur = 1;
        }
        if (info_party.nb_joueur < 0) {
            console.log("y a eu un probleme car le nombre de joueur est negatif");
            info_party.nb_joueur = 1;
            // reset les autre joueur de la game et faire un game_state
            liste_joueur = {};
            liste_joueur[socket.id] = { "name": nickName, "cooldown_miroire": 0, state: "spectator", "recharge": 0 };//on le rajoute a la liste des joueurs
            io.emit("game_state", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur });

        }
        console.log("etat de a la partie :", info_party.etat_party);
        if (info_party.nb_joueur >= info_party.min_joueur && info_party.etat_party == "waiting")//si le nombre de joueur est suffisant on commence la partie
        {
            console.log("La partie commence dans 10 sec !");
            timerEnd = 10;

            let countdown = setInterval(() => {
                timerEnd--;

                if (timerEnd > 0) {
                    io.emit("new_game_in", timerEnd); // on informe tout le monde du temps restant
                } else {
                    clearInterval(countdown); // on stoppe la boucle
                    console.log("La partie commence !");
                    gameStart(); // lancement réel de la partie
                }

            }, 1000); // toutes les secondes
        }
    });

    function gameStart() {
        info_party.etat_party = "started";
        info_party.tour_party = 1;
        // mettre tous les joueur dans liste jouruer en state player
        for (let id_joueur in liste_joueur) {
            liste_joueur[id_joueur].state = "player";
        }
        //dire a tout le monde que la partie commence
        io.emit("party_started", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur });
        construitListeActionPossible();
        sendListeActionPossible();
    }

    function construitListeActionPossible() {
        // construit la liste des action possible pour chaque joueur
        for (let id_joueur in liste_joueur) {
            let action_possible = {};
            // en gros mettre dans action possible les action dont le cout est inferieur ou egal a la recharge du joueur
            // dans le cas du mirroire il faut AUSSI que le cooldown soit a 0
            for (let action in data_action) {
                // on va faire avec un switch plutot
                switch (action) {
                    case "miroire":
                        if (liste_joueur[id_joueur].cooldown_miroire == 0) {
                            action_possible[action] = data_action[action];
                        }
                        break;

                    default:
                        // et qu'il ne possede pas le champ serveur
                        if (data_action[action].cout <= liste_joueur[id_joueur].recharge && data_action[action]?.serveur == undefined) {
                            action_possible[action] = data_action[action];
                        }
                        break;
                }

                /* 
                else if (d'autre truc que j'ai pas encore penser et on le rajoutera ici)
                {}
                */
            }
            lst_action_possible_par_joueur[id_joueur] = action_possible;
        }
    }

    function sendListeActionPossible() {
        // envoie a chaque joueur la liste des action possible
        console.log("Envoie de la liste des actions possibles à chaque joueur");
        for (let id_joueur in liste_joueur) {
            console.log("Envoie de la liste des actions possibles à ", id_joueur, ", qui est ", liste_joueur[id_joueur].name);
            // console.log("Payload pour", id_joueur, lst_action_possible_par_joueur[id_joueur]);
            io.to(id_joueur).emit("action_possible", lst_action_possible_par_joueur[id_joueur]);
        }
    }



    function waitingBeforeNewGame() {
        timerEnd = 10;
        console.log("Nouvelle partie dans 10 secondes");

        // On nettoie un éventuel ancien interval si jamais il tourne encore
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        timerInterval = setInterval(() => {
            timerEnd--;
            if (timerEnd > 0) {
                io.emit("new_game_in", timerEnd);
            } else {
                clearInterval(timerInterval); // très important, sinon ça continue de tourner
                timerInterval = null;

                // reset tous les états
                for (let id_joueur in liste_joueur) {
                    liste_joueur[id_joueur].state = "spectator";
                }
                info_party.etat_party = "waiting";
                lst_action_possible_par_joueur = {};
                info_party.tour_party = 0;
                info_party.nb_joueur = Object.keys(liste_joueur).length;
                dico_action_joueur = {};

                for (let id_joueur in liste_joueur) {
                    let name = liste_joueur[id_joueur].name;
                    liste_joueur[id_joueur] = {
                        name,
                        cooldown_miroire: 0,
                        state: "spectator",
                        recharge: 0,
                        PV: 1,
                        effect: [],
                    };
                }

                // relancer une partie si les conditions sont ok
                if (
                    info_party.nb_joueur >= info_party.min_joueur &&
                    info_party.etat_party === "waiting"
                ) {
                    console.log("La partie commence !");
                    io.emit("new_game_in", 11);// si c'est au dessus de 10 le client ne l'affiche pas
                    gameStart();
                }
            }
        }, 1000); // toutes les secondes
    }


    function applyEffect(resolutionAnswer) {
        // exemple de resolutionAnswer
        // { EhHr_AvFh_7C4vg0AAAG: [ [ 'add', 1 ] ], rIZCXWuRqdboBJM3AAAF: [] }
        for (let id_joueur in resolutionAnswer) {
            for (let effet of resolutionAnswer[id_joueur]) {
                switch (effet[0]) {
                    case 'add':
                        liste_joueur[id_joueur].recharge += effet[1];
                        break;
                    case 'remove_pv':
                        liste_joueur[id_joueur].PV -= effet[1];
                        if (liste_joueur[id_joueur].PV <= 0 || liste_joueur[id_joueur].PV == null) {
                            liste_joueur[id_joueur].state = "dead";
                        }
                        else if (!(liste_joueur[id_joueur].PV > 0))//dernière verif de si il est pas mort
                        {
                            liste_joueur[id_joueur].state = "dead";
                        }
                        break;
                    case 'remove':
                        //effet[1] est le nom de l'action que le joueur n'aura plus le droit d'avoir
                        // effect est une liste qui liste tous les effect que le joueur a pris positif comme négatif
                        liste_joueur[id_joueur].effect.push(effet[1]);
                        if (liste_joueur[id_joueur].effect.includes(effet[1])) {
                            // rajouter l'effet [remove, effet[1]] a la liste des effect du joueur
                            liste_joueur[id_joueur].effect.push([effet[0], effet[1]]);
                        }
                        break;
                }
            }
        }

        // remetre le cooldown mirroire de tous les joueur a 0 SAUF si leurs action est mirroire
        for (let id_joueur in liste_joueur) {
            if (liste_joueur[id_joueur].state == "player" && dico_action_joueur[id_joueur].action !== "miroire") {
                liste_joueur[id_joueur].cooldown_miroire = 0;
            }
        }

        // compter le nb de joueur en state "players" 
        let nb_joueur_player = Object.values(liste_joueur)
            .filter(joueur => joueur.state === "player")
            .length;

        if (nb_joueur_player === 1) {
            // il ne reste plus qu'un joueur en vie
            let id_joueur_vivant = Object.keys(liste_joueur).find(id => liste_joueur[id].state === "player");
            console.log("Le joueur", id_joueur_vivant, "a gagné !");
            // metre le stat du joueur a winner
            liste_joueur[id_joueur_vivant].state = "winner";
            io.to(id_joueur_vivant).emit("you_win");
            // mettre tous les joueur en spectator
            /* for (let id_joueur in liste_joueur) {
                liste_joueur[id_joueur].state = "spectator";
            } */
            waitingBeforeNewGame();
        }
        else if (nb_joueur_player === 0) {
            // y a plus personne en vie
            console.log("Il n'y a plus de joueur en vie, personne n'a gagné !");
            waitingBeforeNewGame();
        }
        else {
            construitListeActionPossible();
        }
    }

    function sendListeActionPossibleForOne(id_joueur) {
        // envoie a un joueur la liste des action possible
        console.log("Envoie de la liste des actions possibles à ", id_joueur, ", qui est ", liste_joueur[id_joueur].name);
        // console.log("Payload pour", id_joueur, lst_action_possible_par_joueur[id_joueur]);
        io.to(id_joueur).emit("action_possible", lst_action_possible_par_joueur[id_joueur]);
    }

    socket.on("thisIsMyAction", (data) => {
        // si le joueur existe pas dans la liste des joueur on fait rien
        if (liste_joueur[socket.id] == undefined || liste_joueur[socket.id].state != "player") {
            console.log("Le joueur", socket.id, "n'existe pas dans la liste des joueurs");
            socket.emit("action_not_valid", "Action non reçue, vous n'êtes pas dans la partie");
            return;
        }
        console.log("Le joueur", socket.id, "a choisi son action :", data);
        // faire une verif que l'action est bien dans la liste des action possible
        //on regarde si data.action est bien dans la liste des clé de lst_action_possible_par_joueur[socket.id]
        // faire une liste de toute les clé de lst_action_possible_par_joueur[socket.id]
        console.log("Liste des actions possibles pour le joueur", socket.id, ":", Object.keys(lst_action_possible_par_joueur[socket.id]));
        if (Object.keys(lst_action_possible_par_joueur[socket.id]).includes(data.action)) {// si l'action est dans la liste des action possible
            dico_action_joueur[socket.id] = data;
            // on met la priority du truc 
            dico_action_joueur[socket.id].priority = data_action[data.action].priority;
            socket.emit("action_valid", "Action reçue");
            // on enleve a se joueur un nb de recharge egale au cout de l'action
            liste_joueur[socket.id].recharge -= data_action[data.action].cout;
            if (liste_joueur[socket.id].recharge < 0) {
                console.log("ERREUR : le joueur ", socket.id, "a une recharge negative");
                liste_joueur[socket.id].recharge = 0;
            }
            // on verifie si tout les joueur "player" on fait leur action
            let nb_joueur_player = Object.values(liste_joueur)
                .filter(joueur => joueur.state === "player")
                .length;
            if (Object.keys(dico_action_joueur).length == nb_joueur_player) {
                console.log("Tous les joueurs ont fait leur action");
                let resolutionAnswer = resolution(dico_action_joueur);
                console.log("Resolution du tour : \n ", resolutionAnswer);

                // envoyer le feedback
                const feedback = [];

                for (const id_joueur in dico_action_joueur) {
                    const actionInfo = dico_action_joueur[id_joueur];
                    const name_joueur = liste_joueur[id_joueur]?.name || id_joueur;

                    if (Array.isArray(actionInfo.target)) {
                        // plusieurs cibles
                        feedback.push({
                            action: actionInfo.action,
                            target: actionInfo.target,
                            id_joueur,
                            name_joueur,
                        });
                    } else if (actionInfo.target) {
                        // cible unique
                        feedback.push({
                            action: actionInfo.action,
                            target: [actionInfo.target],
                            id_joueur,
                            name_joueur,
                        });
                    } else {
                        // pas de cible
                        feedback.push({
                            action: actionInfo.action,
                            id_joueur,
                            name_joueur,
                        });
                    }
                }

                // Émet à tous les clients connectés
                io.emit("last_round_feedback", feedback);

                // appliquer les effet de la resolution
                applyEffect(resolutionAnswer);
                dico_action_joueur = {};
                info_party.tour_party++;
                for (let id_joueur in liste_joueur) {
                    io.to(id_joueur).emit("resolutionDuTour", resolutionAnswer[id_joueur]);
                }

            }
        }
        else {
            socket.emit("action_not_valid", "Action non reçue, elle n'est pas dans la liste des actions possibles");
        }
        // si oui on l'ajoute au dico des action
        // faut voire si jamais c'est le cleint qui doit faire sa 

        //"joueur 4": { "action": "double_pistolet", "target": ["joueur 3", "joueur 1"], "priority": 1 },


    });

    //un joueur veut rejoindre la party
    socket.on("get_game_state", () => {
        console.log("Client ", socket.id, " a demandé l'état de la partie :", info_party.id_party);
        socket.emit("game_state", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur });
    });

    socket.on("get_dico_action", () => {
        console.log("Client ", socket.id, " a demandé le dico des actions :", info_party.id_party);
        socket.emit("dico_action", dico_action_joueur);
    });

    //un joueur veut rejoindre la party
    socket.on("teste", (msg) => {
        console.log("TESSSSSSSSSSSte");
        socket.emit("teste_recu", "j'ai dit tttttttttttteste");
    });

    socket.on("disconnecting", (msg) => {
        console.log("Client déconnecté (via disconnecting) :", socket.id);
        //suprimer le perso de la party
        if (liste_joueur[socket.id] != undefined) {
            delete liste_joueur[socket.id];
            info_party.nb_joueur = Object.keys(liste_joueur).length;
        }
        let nb_joueur_player = Object.values(liste_joueur)
            .filter(joueur => joueur.state === "player")
            .length;
        if (nb_joueur_player < info_party.min_joueur && info_party.etat_party == "started")//si le nombre de joueur est insuffisant on arrete la partie
        {
            console.log("La partie s'arrête !");
            info_party.etat_party = "ended";
            // metre tous les joueur en spectator
            for (let id_joueur in liste_joueur) {
                liste_joueur[id_joueur].state = "spectator";
            }
            timerEnd = 11;
            //clear tous
            io.emit("game_state", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur });
            info_party.etat_party = "waiting";
            lst_action_possible_par_joueur = {};
            info_party.tour_party = 0;


        }
        else { io.emit("game_state", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur }); }
    });

    socket.on("disconnect", () => {
        console.log("Client déconnecté (via disconnect) :", socket.id);
    });


    socket.on("client_quit", () => {
        console.log("Client déconnecté :", socket.id);
        //suprimer le perso de la party
        if (liste_joueur[socket.id] != undefined) {
            delete liste_joueur[socket.id];
            info_party.nb_joueur = Object.keys(liste_joueur).length;
        }
        let nb_joueur_player = Object.values(liste_joueur)
            .filter(joueur => joueur.state === "player")
            .length;
        if (nb_joueur_player < info_party.min_joueur && info_party.etat_party == "started")//si le nombre de joueur est insuffisant on arrete la partie
        {
            console.log("La partie s'arrête !");
            info_party.etat_party = "ended";
            // metre tous les joueur en spectator
            for (let id_joueur in liste_joueur) {
                liste_joueur[id_joueur].state = "spectator";
            }
            timerEnd = 11;
            //clear tous
            io.emit("game_state", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur });
            info_party.etat_party = "waiting";
            lst_action_possible_par_joueur = {};
            info_party.tour_party = 0;


        }
        else { io.emit("game_state", { "info_party_for_client": info_party, "liste_joueur_for_client": liste_joueur }); }
    });

});




// Lancement du serveur HTTP
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Serveur Socket.IO en écoute sur http://localhost:${port}`);
});




