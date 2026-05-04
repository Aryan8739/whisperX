export function getUserDisplay(nickname, uid) {
    const nick = nickname || "anon";
    const tag = uid ? uid.substring(0, 4) : "????";
    return `${nick}#${tag}`;
}
