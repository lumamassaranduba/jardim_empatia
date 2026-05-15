<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$host = "localhost";
$db_name = "jardim_empatia";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["erro" => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM mensagens ORDER BY created_at ASC");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->creatorId) && !empty($data->elementId) && !empty($data->author) && !empty($data->text)) {
        $stmt = $conn->prepare("INSERT INTO mensagens (creator_id, element_id, author, texto, pos_x, pos_y) VALUES (:c, :e, :a, :t, :x, :y)");
        $stmt->execute([
            ':c' => $data->creatorId, ':e' => $data->elementId, ':a' => $data->author,
            ':t' => $data->text, ':x' => $data->pos->x, ':y' => $data->pos->y
        ]);
        echo json_encode(["mensagem" => "Sucesso"]);
    }
}

if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    if(!empty($data->id) && !empty($data->creatorId)) {
        $stmt = $conn->prepare("DELETE FROM mensagens WHERE id = :id AND creator_id = :c");
        $stmt->execute([':id' => $data->id, ':c' => $data->creatorId]);
        echo json_encode(["mensagem" => "Excluída"]);
    }
}
?>