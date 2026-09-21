from enum import Enum


class GamificationItem(str, Enum):
    MICROSCOPE = "microscope"
    DOUBLE_POINTS = "double_points"
    SHIELD = "shield"
    TIME_FREEZE = "time_freeze"

ITEM_PRICES = {
    GamificationItem.MICROSCOPE: 50,      # Che 1/2 đáp án (bỏ 2 đáp án sai)
    GamificationItem.DOUBLE_POINTS: 100,  # Bùa nhân phẩm (x2 điểm)
    GamificationItem.SHIELD: 80,          # Khiên hộ mệnh (Bảo toàn mạng)
    GamificationItem.TIME_FREEZE: 40      # Đóng băng thời gian
}
