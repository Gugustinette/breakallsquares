x = 100

def CheckState(x) :
    if x % 50 == 0 and x*x > 10**9 :
        return True
    else :
        return False

while CheckState(x) == False :
    print(x*x)
    x += 1

print("x found !")

print("grid size (x) = " + str(x))
print("total number of square (x*x) = " + str(x*x))

print("chunk grid size (x/50) = " + str(x/50))
print("total number of chunk (x*x / 2500)" + str(x*x/2500))