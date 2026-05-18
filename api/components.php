<?php
/**
 * JSON API комплектующих для фронта (db.js при открытии по http://).
 * GET ?category=cpu
 * GET ?ids=1,2,4
 */
require_once __DIR__ . "/bootstrap.php";

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo json_encode(["error" => "database_unavailable"], JSON_UNESCAPED_UNICODE);
    exit;
}

function gametech_component_from_row(array $row, ?string $fallbackCategory = null): ?array
{
    $obj = json_decode($row["data"] ?? "", true);
    if (!is_array($obj)) {
        return null;
    }
    if (isset($row["id"])) {
        $obj["id"] = (int) $row["id"];
    }
    if ($fallbackCategory !== null && $fallbackCategory !== "") {
        $obj["category"] = $fallbackCategory;
    } elseif (isset($row["category"]) && (!isset($obj["category"]) || $obj["category"] === "")) {
        $obj["category"] = $row["category"];
    }
    return $obj;
}

function gametech_send_list(array $rows, ?string $fallbackCategory = null): void
{
    $out = [];
    foreach ($rows as $row) {
        $obj = gametech_component_from_row($row, $fallbackCategory);
        if ($obj !== null) {
            $out[] = $obj;
        }
    }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
}

if (isset($_GET["category"]) && $_GET["category"] !== "") {
    $cat = preg_replace("/[^a-z0-9_-]/i", "", $_GET["category"]);
    $stmt = $mysqli->prepare("SELECT id, category, data FROM components WHERE category = ? ORDER BY id");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "prepare_failed"], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt->bind_param("s", $cat);
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    gametech_send_list($rows, $cat);
    exit;
}

if (isset($_GET["ids"]) && $_GET["ids"] !== "") {
    $parts = array_filter(array_map("intval", explode(",", $_GET["ids"])));
    if (count($parts) < 1) {
        echo "[]";
        exit;
    }
    $placeholders = implode(",", array_fill(0, count($parts), "?"));
    $types = str_repeat("i", count($parts));
    $sql = "SELECT id, data FROM components WHERE id IN ($placeholders)";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "prepare_failed"], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt->bind_param($types, ...$parts);
    $stmt->execute();
    $res = $stmt->get_result();
    $byId = [];
    while ($row = $res->fetch_assoc()) {
        $obj = gametech_component_from_row($row);
        if ($obj !== null) {
            $byId[(int) $row["id"]] = $obj;
        }
    }
    $ordered = [];
    foreach ($parts as $pid) {
        if (isset($byId[$pid])) {
            $ordered[] = $byId[$pid];
        }
    }
    echo json_encode($ordered, JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(400);
echo json_encode(["error" => "use_category_or_ids"], JSON_UNESCAPED_UNICODE);
