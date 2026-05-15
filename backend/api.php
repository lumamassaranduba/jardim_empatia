<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit;

$host = "localhost";
$db_name = "jardim_empatia";
$user = "root";
$pass = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["erro" => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// LER MENSAGENS
if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM mensagens ORDER BY created_at ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// CRIAR MENSAGEM
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $conn->prepare("INSERT INTO mensagens (creator_id, element_id, author, texto, pos_x, pos_y) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$data->creatorId, $data->elementId, $data->author, $data->text, $data->pos->x, $data->pos->y]);
    echo json_encode(["status" => "sucesso"]);
}

// ATUALIZAR POSIÇÃO (DRAG AND DROP)
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $conn->prepare("UPDATE mensagens SET pos_x = ?, pos_y = ? WHERE id = ? AND creator_id = ?");
    $stmt->execute([$data->pos_x, $data->pos_y, $data->id, $data->creatorId]);
    echo json_encode(["status" => "atualizado"]);
}

// APAGAR
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $conn->prepare("DELETE FROM mensagens WHERE id = ? AND creator_id = ?");
    $stmt->execute([$data->id, $data->creatorId]);
    echo json_encode(["status" => "removido"]);
}
?>